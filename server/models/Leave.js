const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String, // Optional, can populate from User
    type: { type: String, enum: ['Casual', 'Sick', 'Personal'] },
    date: String, // YYYY-MM-DD
    reason: String,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    substitutions: [{
        slot: Number,
        subject: String,
        class: String,
        subId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        subName: String,
        status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' }
    }]
});

module.exports = mongoose.model('Leave', LeaveSchema);