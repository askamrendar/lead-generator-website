/**
 * Major US cities per state — autocomplete suggestions for the wizard's city and
 * "additional cities" fields. Curated top cities by population per state (~500
 * entries, a few KB). This is a CONVENIENCE list, not a constraint: users can
 * always type any city name; the engine generates pages from whatever is given.
 */

import { usStateAbbr } from './us-states.ts';

export const US_CITIES: Record<string, string[]> = {
  AL: ['Birmingham', 'Montgomery', 'Huntsville', 'Mobile', 'Tuscaloosa', 'Hoover', 'Dothan', 'Auburn', 'Decatur', 'Madison'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau', 'Wasilla', 'Sitka', 'Ketchikan', 'Kenai', 'Palmer'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe', 'Peoria', 'Surprise', 'Yuma', 'Flagstaff'],
  AR: ['Little Rock', 'Fayetteville', 'Fort Smith', 'Springdale', 'Jonesboro', 'Rogers', 'Conway', 'North Little Rock', 'Bentonville', 'Pine Bluff'],
  CA: ['Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim', 'Riverside', 'Santa Ana', 'Irvine', 'Stockton', 'Chula Vista', 'Fremont', 'Santa Clarita', 'San Bernardino', 'Modesto', 'Fontana'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton', 'Arvada', 'Westminster', 'Pueblo', 'Greeley', 'Boulder', 'Centennial'],
  CT: ['Bridgeport', 'New Haven', 'Stamford', 'Hartford', 'Waterbury', 'Norwalk', 'Danbury', 'New Britain', 'West Hartford', 'Greenwich'],
  DE: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford', 'Seaford', 'Georgetown'],
  DC: ['Washington'],
  FL: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Hialeah', 'Port St. Lucie', 'Tallahassee', 'Cape Coral', 'Fort Lauderdale', 'Pembroke Pines', 'Hollywood', 'Gainesville', 'Miramar', 'Coral Springs', 'Palm Bay', 'West Palm Beach', 'Clearwater', 'Lakeland', 'Pompano Beach'],
  GA: ['Atlanta', 'Columbus', 'Augusta', 'Macon', 'Savannah', 'Athens', 'South Fulton', 'Sandy Springs', 'Roswell', 'Warner Robins', 'Johns Creek', 'Albany', 'Alpharetta', 'Marietta'],
  HI: ['Honolulu', 'East Honolulu', 'Pearl City', 'Hilo', 'Waipahu', 'Kailua', 'Kaneohe', 'Kahului'],
  ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Caldwell', 'Pocatello', 'Coeur d\'Alene', 'Twin Falls', 'Post Falls', 'Rexburg'],
  IL: ['Chicago', 'Aurora', 'Joliet', 'Naperville', 'Rockford', 'Springfield', 'Elgin', 'Peoria', 'Waukegan', 'Champaign', 'Cicero', 'Bloomington', 'Schaumburg', 'Evanston'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'Fishers', 'South Bend', 'Carmel', 'Bloomington', 'Hammond', 'Noblesville', 'Lafayette', 'Gary', 'Muncie'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Ankeny', 'Iowa City', 'West Des Moines', 'Waterloo', 'Council Bluffs', 'Dubuque', 'Ames'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Olathe', 'Topeka', 'Lawrence', 'Shawnee', 'Lenexa', 'Manhattan', 'Salina'],
  KY: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Richmond', 'Georgetown', 'Florence', 'Elizabethtown', 'Nicholasville'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner', 'Bossier City', 'Monroe', 'Alexandria', 'Houma'],
  ME: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford', 'Sanford', 'Augusta'],
  MD: ['Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Frederick', 'Waldorf', 'Glen Burnie', 'Gaithersburg', 'Rockville', 'Ellicott City', 'Bethesda', 'Annapolis'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton', 'Quincy', 'Lynn', 'New Bedford', 'Fall River', 'Newton', 'Lawrence', 'Somerville', 'Framingham'],
  MI: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing', 'Dearborn', 'Clinton Township', 'Canton', 'Livonia', 'Troy', 'Westland', 'Farmington Hills', 'Flint', 'Kalamazoo'],
  MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Bloomington', 'Duluth', 'Brooklyn Park', 'Woodbury', 'Plymouth', 'Lakeville', 'Blaine', 'Maple Grove', 'St. Cloud'],
  MS: ['Jackson', 'Gulfport', 'Southaven', 'Biloxi', 'Hattiesburg', 'Olive Branch', 'Tupelo', 'Meridian', 'Greenville', 'Madison'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit', 'O\'Fallon', 'St. Joseph', 'St. Charles', 'Blue Springs', 'Joplin', 'Chesterfield'],
  MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena', 'Kalispell', 'Belgrade'],
  NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont', 'Hastings', 'Papillion', 'Norfolk', 'Columbus'],
  NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Enterprise', 'Spring Valley', 'Sunrise Manor', 'Paradise', 'Sparks', 'Carson City'],
  NH: ['Manchester', 'Nashua', 'Concord', 'Dover', 'Rochester', 'Keene', 'Portsmouth', 'Derry', 'Laconia', 'Londonderry'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Lakewood', 'Edison', 'Woodbridge', 'Toms River', 'Hamilton', 'Trenton', 'Clifton', 'Cherry Hill', 'Brick'],
  NM: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington', 'Hobbs', 'Clovis', 'Carlsbad'],
  NY: ['New York', 'Buffalo', 'Yonkers', 'Rochester', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'White Plains', 'Hempstead', 'Troy', 'Niagara Falls', 'Binghamton'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington', 'High Point', 'Concord', 'Asheville', 'Greenville', 'Gastonia', 'Apex', 'Huntersville'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston', 'Dickinson', 'Mandan'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton', 'Youngstown', 'Lorain', 'Hamilton', 'Springfield', 'Dublin', 'Kettering', 'Elyria'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond', 'Lawton', 'Moore', 'Midwest City', 'Stillwater', 'Enid', 'Owasso'],
  OR: ['Portland', 'Salem', 'Eugene', 'Gresham', 'Hillsboro', 'Bend', 'Beaverton', 'Medford', 'Springfield', 'Corvallis', 'Albany', 'Tigard'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Reading', 'Erie', 'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'York', 'State College', 'Wilkes-Barre', 'Altoona'],
  RI: ['Providence', 'Cranston', 'Warwick', 'Pawtucket', 'East Providence', 'Woonsocket', 'Coventry', 'Cumberland'],
  SC: ['Charleston', 'Columbia', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville', 'Summerville', 'Goose Creek', 'Sumter', 'Florence', 'Myrtle Beach', 'Spartanburg'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Mitchell', 'Yankton', 'Pierre'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Franklin', 'Johnson City', 'Jackson', 'Hendersonville', 'Bartlett', 'Kingsport'],
  TX: ['Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Lubbock', 'Laredo', 'Irving', 'Garland', 'Frisco', 'McKinney', 'Amarillo', 'Grand Prairie', 'Brownsville', 'Killeen', 'Pasadena', 'Denton', 'Mesquite', 'McAllen', 'Waco', 'Round Rock', 'Cedar Park', 'Pflugerville'],
  UT: ['Salt Lake City', 'West Valley City', 'West Jordan', 'Provo', 'St. George', 'Orem', 'Sandy', 'Ogden', 'Lehi', 'South Jordan', 'Layton', 'Millcreek'],
  VT: ['Burlington', 'South Burlington', 'Rutland', 'Essex Junction', 'Bennington', 'Barre', 'Montpelier', 'Winooski'],
  VA: ['Virginia Beach', 'Chesapeake', 'Norfolk', 'Arlington', 'Richmond', 'Newport News', 'Alexandria', 'Hampton', 'Roanoke', 'Portsmouth', 'Suffolk', 'Lynchburg', 'Centreville'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Renton', 'Spokane Valley', 'Federal Way', 'Yakima', 'Kirkland', 'Bellingham', 'Kennewick', 'Auburn'],
  WV: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling', 'Weirton', 'Fairmont', 'Martinsburg'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha', 'Eau Claire', 'Oshkosh', 'Janesville', 'West Allis', 'La Crosse'],
  WY: ['Cheyenne', 'Casper', 'Gillette', 'Laramie', 'Rock Springs', 'Sheridan', 'Green River', 'Evanston'],
};

/** City suggestions for a state (abbreviation OR full name); empty when unknown. */
export function citiesForState(stateInput: string): string[] {
  const abbr = usStateAbbr(stateInput);
  return US_CITIES[abbr] ?? [];
}
