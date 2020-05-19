import format from "date-fns/format"
import formatDistance from "date-fns/formatDistance"
import util from "util"

function blogFormat(date) {
  if (date > Date.now()) {
    date = Date.now()
  }
  var dateFormatted = format(date, "eeee, LLL do u")
  var distanceFormmated = formatDistance(date, new Date(), {
    addSuffix: true,
  })
  return util.format("%s (%s)", dateFormatted, distanceFormmated)
}

export default blogFormat
