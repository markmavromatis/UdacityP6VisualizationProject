# P6 Visualization Project

This code represents my submission for the P6 Visualization project.


## Summary

Based on Bureau of Transportation's Flight Delay statistics for all 2015 domestic flights at US Airports.
I loaded the data into a MongoDB database and filtered it for the top 10 airports with the most departures.
It shows on-time flight statistics for all airlines (responsible for 1% or more of domestic flights) at the top 10 airports.
For delayed flights, it shows the reasons for delays broken down into percentages.

## Design

### Data

From the example data sets provided by Udacity, I was immediately intrigued by flight data. I love to travel and am a United Airlines Gold member (flying around 60,000 miles per year). I was curious about United Airlines, their on-time performance, and general US carrier performance at US airports.

Udacity provided links to older flight data that contained some carriers (i.e. Continental Airlines) that no longer exist. I decided to go straight to the Bureau of Transportation Statistics to get the latest 2015 flight data so that I would have a full year of data to model in a visualization.

The webite provides already aggregated data, but I decided to use my newly obtained MongoDB skills to build my own data using the raw (23MB / month) flight data from here:

[Flight OnTime Performance Data](http://www.transtats.bts.gov/DL_SelectFields.asp?Table_ID=236&DB_Short_Name=On-Time)

I imported the raw data .csv files into a MongoDB database:

`mongoimport --collection flights2015 --type csv --file 2015_airline_delay_causes_Jan.csv --headerline`

From the raw flight data, I identified the top 10 US airports by origin:

`db.flights2015.aggregate([{$group:{_id: “$Origin”, total : {$sum : 1}}}, {$sort : {total : -1}}])`

I then used Python (getAirportCarrierStatistics.py) to aggregate the statistics and publish .csv files with the summary statistics for each month. 

There were some quirks with the data. The delay fields actually hold very precise data about what delays for flight departures and arrivals. If a flight leaves early, these delay fields are negative (!). Because a flight is not considere officially 'delayed' until 15-minutes after departure, I used a field called 'ArrDel15' to flag flights as 'delayed' instead of just checking the precise 'DepDelay' and 'ArrDelay' fields. 'ArrDel15' is a '1' or '0' depending on whether a delayed flight was delayed more than 15 minutes.

For on-time flights (ArrDel15 = 0), I hard-coded 0 for delayed time (whether they are early or slightly delayed). For delayed flights, I aggregated the total delay minutes in addition to a breakdown of the delay reasons and minutes for each. Because delay reasons (and minutes fo reach type of delay) are not broken down by departure delay and arrival delays, I focused on arrival delay (even though I use departure airport). I figured that most people would consider a flight 'on-time' if it arrived within 15-minutes of its scheduled arrival time (regardless of when it departed).

The Python script creates 13 data files. The data files hold monthly data as well as an "annual" file for the whole year. These files are small (13k for the monthly files, 160k for the annual file) and can quickly be loaded in a web browser.

The data consists of 12 columns:

* RecordType - OnTime or Delayed
* Origin - Origin Airport
* Month - Month (January = 1, February = 2, etc.)
* CarrierName - Full name of airline
* Count - # of Flights
* ArrDelayMins - Total minutes of arrival delay
* Cancellations - # of Cancellations. I didn't use this since the numbers are very low.
* CarrierDelayMins - Delayed minutes due to airline
* WeatherDelayMins - Delayed minutes attributed to weather
* NasDelayMins - Delays caused by the National Air System
* SecurityDelayMins - Delays caused by hold-ups at Airport Security
* LateAircraftDelayMins - Delays caused by late aircraft


### Charting API

I chose to base this visualization on the DimpleJS API versus the more complex and powerful D3. 

I wanted to use a simple API that would let me create a visually appealing bar chart showing on-time vs. delayed flights and insights into why flights were delayed. Were winter flights delayed by weather moreso than spring and fall flights? Were the reasons for delays different for each airline? 

With simple APIs, I could focus more time on interactivity features rather than building a complex chart.

### User Interface

This assignment is about creating a visualization with a hybrid narrative that is both author-driven and reader-driven. By keeping the user interface simple, I felt that I could present a story at a high level summary view (annual data) then allowing readers to filter that data to airports of interest or a specific timeframe. I would like my readers to answer questions such as:

"Which airlines are the largest?"
"Which airlines have the best on-time percentages?"
"Which airlines fly out of my airport?"
"Which airines have the best on-time percentage at my airport?"
"Which airines fly the most often at my airport?"
"If I have to fly through a hub airport in January, which one should I use? Does it make a difference?"

Allowing a reader to select a specific airport and time frame make the visualization personal and more useful.

## Feedback

After preparing an early draft of the visualization, I sent out a request for feedback on Facebook. The early draft had two input parameters: Airport and Timeframe based on the User Interface. Changing a parameter triggered a page refresh where the chart and input controls would be redrawn.

Early comments:

* From Anna (mom) - The page refresh is distracting. Airport and Timeframe flicker and look funny when I change it.
* From Christiana (sister) - The airline names are cutoff on the bottom.
* From Dan - Why do you start the query at Chicago O'Hare? If the timeframe defaults to the entire year, why not show totals for all airports?
* From Brandon - On many airports, the smaller airlines are tiny. It's impossible to see the ontime statistics.

To address these issues, I added the following features:

1. Abbreviated airline names to the first word in their name. (i.e. American Airlines -> American)
2. Increased font size to improve readability (especially tool-tips)
3. Used Javascript to update the chart (instead of refreshing the entire page every time)
4. Added a zoom slider control so that readers can zoom into a chart (reduce the scale) to see smaller airlines.
5. Added a new "All Airports" airport option and made this the default. The visualization now starts off with data on all flights departing from all top 10 airports.

## Resources

[DimpleJS](http://dimplejs.org) - JavaScript-based Visualization API for creating charts
[StackOverflow](http://www.stackoverflow.com/) - General source for troubleshooting JavaScript and Dimple issues
[Research and Innovative Technology Administration](http://www.rita.dot.gov) - Website that hosts the flight data used for this visualization.

