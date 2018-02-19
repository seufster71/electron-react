/*
  Author: Edward Seufert - Cborgtech, LLC
*/

exports.compareIgnoreCase = (a,b) => {
  if (a.name.toUpperCase() < b.name.toUpperCase()) {
    return -1;
  } else if (a.name.toUpperCase() > b.name.toUpperCase()) {
    return 1;
  } else {
    return 0;
  }
}

exports.compareNumber = (a,b) => {
  if (a.name < b.name) {
    return -1;
  } else if (a.name > b.name) {
    return 1;
  } else {
    return 0;
  }
}

exports.compareYearMonth = (a,b) => {
  const aray = a.name.split("-");
  const bray = b.name.split("-");
  const ap1 = parseInt(aray[0]);
  const bp1 = parseInt(bray[0]);
  const ap2 = parseInt(aray[1]);
  const bp2 = parseInt(bray[1]);
  if (ap1 < bp1) {
    return 1;
  } else if (ap1 > bp1) {
    return -1;
  } else {
    if (ap2 < bp2) {
      return 1;
    } else if (ap2 > bp2) {
      return -1;
    } else {
      return 0;
    }
  }
}
