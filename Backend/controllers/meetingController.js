const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const Staff = require('../models/Staff');
const Client = require('../models/Client');
const Company = require('../models/Company');

// Helper: Generate a mock Zoom link
const generateMockZoomLink = () => `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`;

// Create a meeting (company only)
exports.createMeeting = async (req, res) => {
  try {
    console.log('Creating meeting, request body:', req.body);
    console.log('User object:', req.user);
    
    const { title, description, startTime, endTime, participants } = req.body;
    // participants: [{ user, userType }]
    const zoomLink = generateMockZoomLink();
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication error: User not found in request' 
      });
    }
    
    // Get company information to include in notification
    const company = await Company.findById(req.user._id).select('companyName');
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    const meeting = await Meeting.create({
      title,
      description,
      startTime,
      endTime,
      zoomLink,
      createdBy: req.user._id,
      participants: participants.map(p => ({ ...p, status: 'pending' })),
      notificationsSent: false
    });
    
    // Format date and time for notifications
    const meetingDate = new Date(startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const meetingTime = new Date(startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Send notifications to participants with personalized messages
    for (const p of participants) {
      let participantName = '';
      let customMessage = '';
      
      // Get participant name based on userType for personalized notification
      if (p.userType === 'Client') {
        const client = await Client.findById(p.user).select('fullName');
        participantName = client ? client.fullName : 'Client';
        customMessage = `Dear ${participantName}, ${company.companyName} has scheduled a meeting with you: "${title}" on ${meetingDate} at ${meetingTime}.`;
      } else if (p.userType === 'Staff') {
        const staff = await Staff.findById(p.user).select('fullName');
        participantName = staff ? staff.fullName : 'Staff Member';
        customMessage = `Dear ${participantName}, ${company.companyName} has scheduled a meeting: "${title}" on ${meetingDate} at ${meetingTime} that requires your attendance.`;
      } else {
        customMessage = `A new meeting has been scheduled: "${title}" on ${meetingDate} at ${meetingTime}.`;
      }
      
      await Notification.create({
        userId: p.user,
        userType: p.userType,
        type: 'meeting_invite',
        message: customMessage,
        data: { 
          meetingId: meeting._id,
          title: meeting.title,
          description: meeting.description,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          zoomLink: meeting.zoomLink,
          companyName: company.companyName
        },
        isRead: false
      });
    }
    
    meeting.notificationsSent = true;
    await meeting.save();
    
    res.json({ 
      success: true, 
      data: meeting,
      message: 'Meeting created successfully and notifications sent to all participants'
    });
  } catch (err) {
    console.error('Error creating meeting:', err);
    res.status(500).json({ success: false, message: 'Error creating meeting', error: err.message });
  }
};

// Update an existing meeting
exports.updateMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const { title, description, startTime, endTime, participants } = req.body;
    
    // Find the meeting
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    // Check if user is authorized to update (only creator can update)
    if (meeting.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this meeting' });
    }
    
    // Get company information for notification
    const company = await Company.findById(req.user._id).select('companyName');
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    // Track what was updated for notifications
    const updates = [];
    if (title && title !== meeting.title) updates.push('title');
    if (description && description !== meeting.description) updates.push('description');
    if (startTime && new Date(startTime).getTime() !== new Date(meeting.startTime).getTime()) updates.push('time');
    
    // Update meeting fields
    meeting.title = title || meeting.title;
    meeting.description = description || meeting.description;
    meeting.startTime = startTime || meeting.startTime;
    meeting.endTime = endTime || meeting.endTime;
    
    // Format date and time for notifications
    const meetingDate = new Date(meeting.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const meetingTime = new Date(meeting.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // If participants are being updated
    if (participants && participants.length > 0) {
      // Get existing participant IDs
      const existingParticipantIds = meeting.participants.map(p => p.user.toString());
      
      // Add new participants with notifications
      const newParticipants = participants.filter(p => !existingParticipantIds.includes(p.user));
      for (const p of newParticipants) {
        meeting.participants.push({ ...p, status: 'pending' });
        
        // Get participant name based on userType for personalized notification
        let participantName = '';
        let customMessage = '';
        
        if (p.userType === 'Client') {
          const client = await Client.findById(p.user).select('fullName');
          participantName = client ? client.fullName : 'Client';
          customMessage = `Dear ${participantName}, ${company.companyName} has invited you to a meeting: "${meeting.title}" on ${meetingDate} at ${meetingTime}.`;
        } else if (p.userType === 'Staff') {
          const staff = await Staff.findById(p.user).select('fullName');
          participantName = staff ? staff.fullName : 'Staff Member';
          customMessage = `Dear ${participantName}, ${company.companyName} has added you to a meeting: "${meeting.title}" on ${meetingDate} at ${meetingTime}.`;
        } else {
          customMessage = `You have been invited to a meeting: "${meeting.title}" on ${meetingDate} at ${meetingTime}.`;
        }
        
        // Send notification to new participant
        await Notification.create({
          userId: p.user,
          userType: p.userType,
          type: 'meeting_invite',
          message: customMessage,
          data: { 
            meetingId: meeting._id,
            title: meeting.title,
            description: meeting.description,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            zoomLink: meeting.zoomLink,
            companyName: company.companyName
          }
        });
      }
      
      // Track removed participants
      const removedParticipants = meeting.participants.filter(p => 
        !participants.some(newP => newP.user === p.user.toString())
      );
      
      // Update existing participants list (only keep ones in the new list)
      meeting.participants = meeting.participants.filter(p => 
        participants.some(newP => newP.user === p.user.toString())
      );
      
      // If someone was removed, add to updates
      if (removedParticipants.length > 0) {
        updates.push('participants');
      }
    }
    
    // Save the updated meeting
    await meeting.save();
    
    // Send notifications about meeting update to all participants
    if (updates.length > 0) {
      for (const p of meeting.participants) {
        let participantName = '';
        let updateMessage = '';
        
        // Construct appropriate message based on what was updated
        let updateDetails = '';
        if (updates.includes('title')) updateDetails += 'title, ';
        if (updates.includes('description')) updateDetails += 'description, ';
        if (updates.includes('time')) updateDetails += 'schedule, ';
        if (updates.includes('participants')) updateDetails += 'participants, ';
        
        // Remove trailing comma and space
        updateDetails = updateDetails.replace(/,\s*$/, '');
        
        if (p.userType === 'Client') {
          const client = await Client.findById(p.user).select('fullName');
          participantName = client ? client.fullName : 'Client';
          updateMessage = `Dear ${participantName}, ${company.companyName} has updated the ${updateDetails} of the meeting: "${meeting.title}" scheduled for ${meetingDate} at ${meetingTime}.`;
        } else if (p.userType === 'Staff') {
          const staff = await Staff.findById(p.user).select('fullName');
          participantName = staff ? staff.fullName : 'Staff Member';
          updateMessage = `Dear ${participantName}, ${company.companyName} has updated the ${updateDetails} of the meeting: "${meeting.title}" scheduled for ${meetingDate} at ${meetingTime}.`;
        } else {
          updateMessage = `The meeting "${meeting.title}" has been updated (changes to: ${updateDetails}).`;
        }
        
        await Notification.create({
          userId: p.user,
          userType: p.userType,
          type: 'meeting_update',
          message: updateMessage,
          data: { 
            meetingId: meeting._id,
            title: meeting.title,
            description: meeting.description,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            zoomLink: meeting.zoomLink,
            companyName: company.companyName,
            updates: updates
          }
        });
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Meeting updated successfully and notifications sent to all participants',
      data: meeting 
    });
  } catch (err) {
    console.error('Error updating meeting:', err);
    res.status(500).json({ success: false, message: 'Error updating meeting', error: err.message });
  }
};

// Get meetings for the logged-in user
exports.getMyMeetings = async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.role === 'company' ? 'Company' : req.user.role === 'client' ? 'Client' : 'Staff';
    const meetings = await Meeting.find({
      $or: [
        { 'participants.user': userId },
        { createdBy: userId }
      ]
    })
      .populate('createdBy', 'name fullName email')
      .populate('participants.user', 'fullName email role profilePicture')
      .sort({ startTime: 1 });
    res.json({ success: true, data: meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching meetings', error: err.message });
  }
};

// Confirm attendance for a meeting
exports.confirmMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const userId = req.user._id;
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });
    let updated = false;
    meeting.participants = meeting.participants.map(p => {
      if (p.user.toString() === userId.toString()) {
        updated = true;
        return { ...p.toObject(), status: 'confirmed' };
      }
      return p;
    });
    if (!updated) return res.status(403).json({ success: false, message: 'Not a participant' });
    await meeting.save();
    res.json({ success: true, message: 'Meeting confirmed', data: meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error confirming meeting', error: err.message });
  }
};

// Get the most recently created meeting
exports.getLastCreatedMeeting = async (req, res) => {
  try {
    const lastMeeting = await Meeting.findOne()
      .sort({ _id: -1 }) // Sort by _id in descending order to get the most recent
      .populate('createdBy', 'companyName fullName email')
      .populate({
        path: 'participants.user',
        select: 'fullName companyName email role profilePicture',
      });
    
    if (!lastMeeting) {
      return res.status(404).json({ 
        success: false, 
        message: 'No meetings found' 
      });
    }

    res.json({ success: true, data: lastMeeting });
  } catch (err) {
    console.error('Error fetching last meeting:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching last meeting', 
      error: err.message 
    });
  }
};

// Cancel a meeting (only creator can cancel)
exports.cancelMeeting = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const { cancelReason } = req.body;
    
    // Find the meeting
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    
    // Check if user is authorized to cancel (only creator can cancel)
    if (meeting.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this meeting' });
    }
    
    // Get company information for notification
    const company = await Company.findById(req.user._id).select('companyName');
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    
    // Format date and time for notifications
    const meetingDate = new Date(meeting.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const meetingTime = new Date(meeting.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Send cancellation notifications to all participants
    for (const p of meeting.participants) {
      let participantName = '';
      let cancelMessage = '';
      
      // Get participant name based on userType for personalized notification
      if (p.userType === 'Client') {
        const client = await Client.findById(p.user).select('fullName');
        participantName = client ? client.fullName : 'Client';
        cancelMessage = `Dear ${participantName}, ${company.companyName} has canceled the meeting: "${meeting.title}" that was scheduled for ${meetingDate} at ${meetingTime}.`;
      } else if (p.userType === 'Staff') {
        const staff = await Staff.findById(p.user).select('fullName');
        participantName = staff ? staff.fullName : 'Staff Member';
        cancelMessage = `Dear ${participantName}, ${company.companyName} has canceled the meeting: "${meeting.title}" that was scheduled for ${meetingDate} at ${meetingTime}.`;
      } else {
        cancelMessage = `The meeting "${meeting.title}" scheduled for ${meetingDate} at ${meetingTime} has been canceled.`;
      }
      
      // Add reason if provided
      if (cancelReason) {
        cancelMessage += ` Reason: ${cancelReason}`;
      }
      
      await Notification.create({
        userId: p.user,
        userType: p.userType,
        type: 'meeting_canceled',
        message: cancelMessage,
        data: { 
          meetingId: meeting._id,
          title: meeting.title,
          startTime: meeting.startTime,
          cancelReason: cancelReason || 'No reason provided',
          companyName: company.companyName
        }
      });
    }
    
    // Add canceled flag to meeting and save reason
    meeting.canceled = true;
    meeting.cancelReason = cancelReason || 'No reason provided';
    meeting.canceledAt = new Date();
    await meeting.save();
    
    res.json({ 
      success: true, 
      message: 'Meeting canceled successfully and notifications sent to all participants',
      data: meeting 
    });
  } catch (err) {
    console.error('Error canceling meeting:', err);
    res.status(500).json({ success: false, message: 'Error canceling meeting', error: err.message });
  }
};

// Send reminders for upcoming meetings
exports.sendMeetingReminders = async (req, res) => {
  try {
    // Get current time
    const now = new Date();
    
    // Find meetings that:
    // 1. Are not canceled
    // 2. Haven't started yet
    // 3. Are within the next 24 hours
    const upcomingMeetings = await Meeting.find({
      canceled: { $ne: true },
      startTime: { 
        $gt: now, 
        $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now
      }
    }).populate('createdBy', 'companyName');
    
    console.log(`Found ${upcomingMeetings.length} upcoming meetings for reminders`);
    
    const remindersSent = [];
    
    for (const meeting of upcomingMeetings) {
      // Calculate time until meeting starts
      const timeUntilMeeting = meeting.startTime.getTime() - now.getTime();
      const hoursUntilMeeting = timeUntilMeeting / (1000 * 60 * 60);
      
      // Format date and time for notification
      const meetingDate = new Date(meeting.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const meetingTime = new Date(meeting.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Determine what type of reminder to send based on time until meeting
      let reminderType = null;
      
      if (hoursUntilMeeting <= 1 && !meeting.reminders.some(r => r.type === '1h')) {
        // Within 1 hour and no 1-hour reminder sent yet
        reminderType = '1h';
      } else if (hoursUntilMeeting <= 24 && hoursUntilMeeting > 23 && !meeting.reminders.some(r => r.type === '24h')) {
        // Around 24 hours and no 24-hour reminder sent yet
        reminderType = '24h';
      } else if (hoursUntilMeeting <= 0.25 && !meeting.reminders.some(r => r.type === '15min')) {
        // Within 15 minutes and no 15-minute reminder sent yet
        reminderType = '15min';
      }
      
      if (reminderType) {
        console.log(`Sending ${reminderType} reminder for meeting: ${meeting.title}`);
        
        // Send reminder notification to all participants
        for (const p of meeting.participants) {
          let participantName = '';
          let reminderMessage = '';
          let timeText = '';
          
          // Generate appropriate time text
          switch (reminderType) {
            case '24h':
              timeText = 'tomorrow';
              break;
            case '1h':
              timeText = 'in 1 hour';
              break;
            case '15min':
              timeText = 'in 15 minutes';
              break;
          }
          
          // Get participant name and customize message based on userType
          if (p.userType === 'Client') {
            const client = await Client.findById(p.user).select('fullName');
            participantName = client ? client.fullName : 'Client';
            reminderMessage = `Dear ${participantName}, reminder: You have a meeting with ${meeting.createdBy.companyName}: "${meeting.title}" ${timeText} (${meetingDate} at ${meetingTime}).`;
          } else if (p.userType === 'Staff') {
            const staff = await Staff.findById(p.user).select('fullName');
            participantName = staff ? staff.fullName : 'Staff Member';
            reminderMessage = `Dear ${participantName}, reminder: You have a meeting scheduled by ${meeting.createdBy.companyName}: "${meeting.title}" ${timeText} (${meetingDate} at ${meetingTime}).`;
          } else {
            reminderMessage = `Reminder: Meeting "${meeting.title}" is scheduled ${timeText} (${meetingDate} at ${meetingTime}).`;
          }
          
          // Create the notification
          await Notification.create({
            userId: p.user,
            userType: p.userType,
            type: 'meeting_reminder',
            message: reminderMessage,
            data: { 
              meetingId: meeting._id,
              title: meeting.title,
              description: meeting.description,
              startTime: meeting.startTime,
              endTime: meeting.endTime,
              zoomLink: meeting.zoomLink,
              companyName: meeting.createdBy.companyName,
              reminderType: reminderType
            }
          });
        }
        
        // Add the reminder to the meeting's reminder history
        meeting.reminders.push({
          sentAt: now,
          type: reminderType
        });
        
        await meeting.save();
        remindersSent.push({
          meetingId: meeting._id,
          title: meeting.title,
          reminderType: reminderType,
          participantCount: meeting.participants.length
        });
      }
    }
    
    if (res) {
      res.json({
        success: true,
        message: `Sent ${remindersSent.length} meeting reminders`,
        data: remindersSent
      });
    }
    
    return {
      success: true,
      remindersSent
    };
  } catch (err) {
    console.error('Error sending meeting reminders:', err);
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Error sending meeting reminders',
        error: err.message
      });
    }
    return {
      success: false,
      error: err.message
    };
  }
};
