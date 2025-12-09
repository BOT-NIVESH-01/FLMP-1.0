const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const User = require('../models/User');
const Leave = require('../models/Leave');
const Timetable = require('../models/Timetable');

// Utility to get Day Name from Date String
const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// @route   GET api/data/users
// @desc    Get all users (for substitute finding)
// @access  Private
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/data/timetable
// @desc    Get timetable entries (supports date-specific filtering)
// @access  Private
router.get('/timetable', auth, async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};

    if (date) {
      // If a date is provided, return Master Schedule (no date) 
      // AND Specific entries for that date (substitutions)
      query = {
        $or: [
          { date: { $exists: false } }, 
          { date: null },               
          { date: date }                
        ]
      };
    }

    const timetable = await Timetable.find(query);
    res.json(timetable);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/data/leaves
// @desc    Get leaves based on role
// @access  Private
router.get('/leaves', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ msg: 'User not found' });

    let leaves;
    // HOD/Admin sees ALL leaves
    if (currentUser.role === 'HOD' || currentUser.role === 'Admin') {
      leaves = await Leave.find().sort({ date: -1 });
    } else {
      // Faculty sees THEIR OWN requests AND requests where they are a SUBSTITUTE
      leaves = await Leave.find({
        $or: [
          { userId: req.user.id },
          { "substitutions.subId": req.user.id }
        ]
      }).sort({ date: -1 });
    }
    res.json(leaves);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/data/leaves
// @desc    Create a new leave request
// @access  Private
router.post('/leaves', auth, async (req, res) => {
  try {
    const { type, date, reason, substitutions } = req.body;
    
    // --- VALIDATION: CHECK FOR EXISTING LEAVE ON SAME DAY ---
    // Check if user has a Pending or Approved leave on this date
    const existingLeave = await Leave.findOne({ 
      userId: req.user.id, 
      date: date,
      status: { $in: ['Pending', 'Approved'] } // Allow re-applying if previous was Rejected
    });

    if (existingLeave) {
      return res.status(400).json({ msg: 'You have already applied for leave on this date.' });
    }
    // --------------------------------------------------------

    const user = await User.findById(req.user.id);

    const newLeave = new Leave({
      userId: req.user.id,
      userName: user.name,
      type,
      date,
      reason,
      status: 'Pending',
      substitutions // Array of { slot, subject, class, subId, subName, status: 'Pending' }
    });

    const leave = await newLeave.save();
    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH api/data/leaves/:id/substitute
// @desc    Faculty accepts/rejects substitution
// @access  Private
router.patch('/leaves/:id/substitute', auth, async (req, res) => {
  const { slot, status } = req.body; 

  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });

    // 1. Find the specific substitution sub-document
    const subIndex = leave.substitutions.findIndex(s => s.slot === parseInt(slot) && s.subId.toString() === req.user.id);
    
    if (subIndex === -1) {
      return res.status(401).json({ msg: 'Not authorized for this substitution' });
    }

    // 2. Update status
    leave.substitutions[subIndex].status = status;
    await leave.save();

    // 3. IF ACCEPTED: Update the Master Timetable for that SPECIFIC DATE only
    if (status === 'Accepted') {
      const subReq = leave.substitutions[subIndex];
      const dayName = getDayName(leave.date);

      const newTimetableEntry = new Timetable({
        userId: req.user.id, // The logged-in substitute becomes busy
        day: dayName,
        slot: subReq.slot,
        subject: `Sub: ${subReq.subject}`, // Mark as substitution
        class: subReq.class,
        date: leave.date 
      });

      await newTimetableEntry.save();
    }

    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH api/data/leaves/:id/force-substitute
// @desc    Admin forcefully assigns and accepts a substitute
// @access  Private (HOD/Admin only)
router.patch('/leaves/:id/force-substitute', auth, async (req, res) => {
  const { slot, subId, subName } = req.body;

  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser || (currentUser.role !== 'HOD' && currentUser.role !== 'Admin')) {
      return res.status(403).json({ msg: 'Not authorized. Admin/HOD role required.' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });

    const subIndex = leave.substitutions.findIndex(s => s.slot === parseInt(slot));
    if (subIndex === -1) return res.status(404).json({ msg: 'Slot not found in substitutions' });

    // 1. Force update the substitution details
    leave.substitutions[subIndex].subId = subId;
    leave.substitutions[subIndex].subName = subName;
    leave.substitutions[subIndex].status = 'Accepted'; // Force Accept

    await leave.save();

    // 2. Update Master Timetable for the FORCED substitute
    const subReq = leave.substitutions[subIndex];
    const dayName = getDayName(leave.date);

    const newTimetableEntry = new Timetable({
      userId: subId, 
      day: dayName,
      slot: subReq.slot,
      subject: `Sub: ${subReq.subject} (Admin Assigned)`,
      class: subReq.class,
      date: leave.date
    });

    await newTimetableEntry.save();

    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH api/data/leaves/:id/status
// @desc    HOD approves/rejects final leave
// @access  Private (HOD/Admin only)
router.patch('/leaves/:id/status', auth, async (req, res) => {
  const { status } = req.body; // 'Approved' or 'Rejected'

  try {
    // FIX 1: Fetch FRESH user data from DB for robust role checking
    const currentUser = await User.findById(req.user.id);
    
    if (!currentUser || (currentUser.role !== 'HOD' && currentUser.role !== 'Admin')) {
      return res.status(403).json({ msg: 'Not authorized. Admin/HOD role required.' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });

    leave.status = status;
    await leave.save();

    // FIX 2: Atomic Update for Leave Balance (prevents save() overwrites)
    if (status === 'Approved') {
      const typeKey = leave.type.toLowerCase(); // 'casual', 'sick', etc.
      
      // Use MongoDB $inc (increment) operator with negative value to decrement
      await User.findByIdAndUpdate(
        leave.userId,
        { $inc: { [`leaveBalance.${typeKey}`]: -1 } } 
      );
    }

    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;