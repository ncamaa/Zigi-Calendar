const

//HELPER FUNCTIONS
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
 * Adds a vacancy slot to the openSlots array
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
 * Returns the first time of the day
 * 
 * @param {String} dayTime - a String formatted in Zigi Date Format: yyyy-mm-ddThh:mm:ss+00:00 | (UTC)
 * 
 * @returns {String} - a String formatted in Zigi Date Format that represents the start of the day.
 */
getFirstTimeOfDay = dayTime => {
  //create a date with the first time of the day.
  const util_Date = new Date(dayTime)
  util_Date.setUTCHours(0,0,0,0)
  //convert to the wanted format and return
  return toZigiISO(util_Date)
},

/**
 * Returns the last time of the day
 * 
 * @param {String} dayTime - a String formatted in Zigi Date Format: yyyy-mm-ddThh:mm:ss+00:00 | (UTC)
 * 
 * @returns {String} - a String formatted in Zigi Date Format that represents the start of the day.
 */
getLastTimeOfDay = dayTime => {
  //create a date with the last time of the day.
  const util_Date = new Date(dayTime)
  //set for the last time of the day
  util_Date.setUTCHours(23,59,59,999)
  //convert to the wanted format and return
  return toZigiISO(util_Date)
},
//HELPER FUNCTIONS - END

//CONST VARS
//an array to contain all the meetings from the input
allMeetings = [],
//an array to contain all the open slots computed from the input, later to be returned as the output of the main thread
openSlots = [],
//CONST VARS - END


/** THE MAIN FUNCTION OF THE THREAD
 * Determine the open slots of a day in the calendar according to the provided data.
 * 
 * @param {String} dateStr - a string in a normal ISO format (Date.toISOString)
 * 
 * @returns {JSON} an array of available slots for the day || 'all of the day is vacant.' if no meetings are present. 
 */
work = rawData => {

  //parse the JSON data input to javascript variable
  data = JSON.parse(rawData)

  if (!Array.isArray(data)) {
    return JSON.stringify('Data must be an array of calendars')
  }

  //combine all meetings to a single array of meetings
  data.forEach(cal =>{
    //make sure meetings exist and it is an array
    if (!Array.isArray(cal.meetings)) return
    cal.meetings.forEach(m => {
      allMeetings.push(m)
    })
  });
  
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
  
  //get first time of the day in the standard format
  let pointer = getFirstTimeOfDay(allMeetings[0].startTime)
  // Disclaimer - if a meeting of yesterday ended after midnight, the pointer should be set to the endTime of the latest meeting
  
  //get first time of the day in the standard format
  const lastTimeOfDay = getLastTimeOfDay(allMeetings[0].startTime)
  //Disclaimer - if the input will contain meetings in a range of more then one day we would need to do it in another way. We will have to require boundaries in the input, otherwise the first and last open slots will be from the beginning of time and to the end of time, accordingly. In case we want to just add slots from the start of the day of the first meeting to the end of the day of the meeting that ends last (not necessarily the last meeting). We can then create a sorted array of all the meetings ending times, then get the latest one, and run "getLastTimeOfDay()" on this ending time to get the ending boundary.

  //this will be used to create the last slot.
  let latestMeetingEndTime = pointer
  
  //loop over all the meetings to determine the rest of the open slots
  allMeetings.forEach(m => {
    if (m.startTime > pointer) { //current meeting starts AFTER last meeting ends
      addSlot(pointer, m.startTime)
      //move pointer to the current meetings' ending time
      pointer = m.endTime
    } else { //current meeting starts BEFORE last meetings ends
      //if current meeting ending time is after the current pointer -> move the pointer
      if (m.endTime > pointer) pointer = m.endTime 
    } 
    //determine latest meeting
    if (m.endTime > latestMeetingEndTime) latestMeetingEndTime = m.endTime
  })

  //make sure the last time is not already taken, then add the last slot
  if (latestMeetingEndTime < lastTimeOfDay) {
    addSlot(latestMeetingEndTime, lastTimeOfDay)
  }

  if (!openSlots.length) return JSON.stringify('Zero vacancy for this day.')

  return JSON.stringify(openSlots)
}, // main function end

//an input example
exampleData = `
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
//run the main function
res = work(exampleData)
//log the output
console.log(JSON.parse(res))