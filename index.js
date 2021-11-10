const

//utils
/**
 * Convert a Date string to the standard format
 * 
 * @param {String} dateStr - a string in a normal ISO format (Date.toISOString)
 * 
 * @returns the formatted string
 */
toZigiISO = dateStr => {
  const 
    s = dateStr.toISOString(),
    s2 = s.substring(0, s.length-5)
  return s2 + '+00:00' //utc
},
/**
 * Adds a slot to the openSlots array
 * 
 * @param {String} startTime - a string in a standard format that represents the starting time of the slot
 * @param {String} endTime   - a string in a standard format that represents the ending time of the slot
 * 
 */
addSlot = (startTime, endTime) => {
  const slot = {
    startTime: startTime,
    endTime: endTime,
  }
  openSlots.push(slot)
},
/**
 * Determine the open slots of a day in the calendar according to the provided data.
 * 
 * @param {String} dateStr - a string in a normal ISO format (Date.toISOString)
 * 
 * @returns {JSON} an array of available slots for the day || 'all of the day is vacant.' if no meetings are present. 
 */
work = data => {

  //combine all meetings to a single array of meetings
  data.forEach(cal => 
    cal.meetings.forEach(m => {
      allMeetings.push(m)
    })
  );
  
  //no meetings
  if (!allMeetings.length) {
    return JSON.stringify('all of the day is vacant.')
  }

  //sort by start time
  allMeetings.sort( (a, b) => {
    if (a.startTime > b.startTime) return 1
    if (a.startTime < b.startTime) return -1
    return 0
  })
  
  //create a date with the first time of the day.
  const util_Date = new Date(allMeetings[0].startTime)
  util_Date.setUTCHours(0,0,0,0)
  //convert to the wanted format
  let pointer = toZigiISO(util_Date)
  // Disclaimer -if a meeting of yesterday ended after midnight, the pointer should be set to the endTime of the latest meeting
  
  //same for last time of the day
  util_Date.setUTCHours(23,59,59,999)
  //convert to the wanted format
  const lastTimeOfDay = toZigiISO(util_Date)

  //this will be used to create the last slot.
  let latestMeetingEndTime = pointer
  
  //loop over all the meetings to determine the rest of the open slots
  allMeetings.forEach(m => {
    if (m.startTime > pointer) { //meeting starts AFTER last meeting ends
      addSlot(pointer, m.startTime)
      pointer = m.endTime
    } else { //meeting starts BEFORE last meetings ends
      pointer = m.endTime
    }
    //determine latest meeting
    if (m.endTime > latestMeetingEndTime) latestMeetingEndTime = m.endTime
  })

  //make sure the last time is not already taken, then add the last slot
  if (latestMeetingEndTime < lastTimeOfDay) {
    addSlot(latestMeetingEndTime, lastTimeOfDay)
  }

  return JSON.stringify(openSlots)
},
//const vars
allMeetings     = [],
openSlots       = [],
offsetInMinutes = new Date().getTimezoneOffset(),
rawData = `
[{
  "name": "Betty",
  "meetings": [{
      "startTime": "2021-03-10T08:55:39+00:00",
      "endTime": "2021-03-10T09:15:39+00:00",
      "subject": "Meeting 1"
    },
    {
      "startTime": "2021-03-10T09:55:39+00:00",
      "endTime": "2021-03-10T10:15:39+00:00",
      "subject": "Meeting 2"
    },
    {
      "startTime": "2021-03-10T11:55:39+00:00",
      "endTime": "2021-03-10T12:15:39+00:00",
      "subject": "Meeting 3"
    }
  ]
},
{
  "name": "John",
  "meetings": [{
      "startTime": "2021-03-10T08:15:39+00:00",
      "endTime": "2021-03-10T09:55:39+00:00",
      "subject": "Meeting a"
    },
    {
      "startTime": "2021-03-10T10:15:39+00:00",
      "endTime": "2021-03-10T10:55:39+00:00",
      "subject": "Meeting b"
    },
    {
      "startTime": "2021-03-10T11:15:39+00:00",
      "endTime": "2021-03-10T12:55:39+00:00",
      "subject": "Meeting c"
    }
  ]
}]
`,
data = JSON.parse(rawData)
//end const

//init
const res = work(data)
console.log(res)