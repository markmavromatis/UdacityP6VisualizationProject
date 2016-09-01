from pymongo import MongoClient
client = MongoClient()

db = MongoClient().test
print("Hello World")

monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

airlineCodes = {}
airlineCodes['AA'] = "American Airlines"
airlineCodes['B6'] = "JetBlue Airways"
airlineCodes['AS'] = "Alaska Airlines"
airlineCodes['F9'] = "Frontier Airlines"
airlineCodes['NK'] = "Spirit Airlines"
airlineCodes['UA'] = "United Airlines"
airlineCodes['EV'] = "ExpressJet Airlines"
airlineCodes['MQ'] = "Envoy Air"
airlineCodes['HA'] = "Hawaiian Airlines"
airlineCodes['VX'] = "Virgin America"
airlineCodes['DL'] = "Delta Air Lines"
airlineCodes['OO'] = "SkyWest Airlines"
airlineCodes['US'] = "US Airways"
airlineCodes['WN'] = "Southwest Airlines"

months = [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
filename_base = 'airport_carrier_stats'
filename_extension = '.csv'
for i in months:
	pipeline = []
	if i is not None:
		pipeline.append({"$match" : {"Month" : i}})

	pipeline.extend([
		{"$match" : {"Origin" : {"$in" : ["ATL",'ORD','DFW','DEN','LAX',
			'SFO', 'IAH', 'PHX', 'LAS', 'MSP'] }, "ArrDel15" : 0}},
	  	{"$group" : {"_id": {"Origin" : "$Origin", "Month" : "$Month", 
	  		"Carrier" : "$Carrier"}, "total" : {"$sum" : 1}, "cancellations" : {
	  		"$sum" : "$Cancelled"}, "carrierDelayMins" : {"$sum" : 
	  		"$CarrierDelay"}, "weatherDelayMins" : {"$sum" : 
	  		"$WeatherDelay"}, "nasDelayMins" : {"$sum" : "$NASDelay"},
	  		"securityDelayMins" : {"$sum" : "$SecurityDelay"},
	  		"lateAircraftDelayMins" : {"$sum" : "$LateAircraftDelay"}}}, 
	  	{"$sort" : {"_id" : 1}}
	])
	results_ontime = db.flights2015.aggregate(pipeline) 

	pipeline = []
	if i is not None:
		pipeline.append({"$match" : {"Month" : i}})

	pipeline.extend([
		{"$match" : {"Origin" : {"$in" : ["ATL",'ORD','DFW','DEN','LAX',
			'SFO', 'IAH', 'PHX', 'LAS', 'MSP'] }, "ArrDel15" : 1}},
	  	{"$group" : {"_id": {"Origin" : "$Origin", "Month" : "$Month", 
	  		"Carrier" : "$Carrier"}, "total" : {"$sum" : 1}, "cancellations" : {
	  		"$sum" : "$Cancelled"}, "arriveDelayMins" : {"$sum" : "$ArrDelay"}, "carrierDelayMins" : {"$sum" : 
	  		"$CarrierDelay"}, "weatherDelayMins" : {"$sum" : 
	  		"$WeatherDelay"}, "nasDelayMins" : {"$sum" : "$NASDelay"},
	  		"securityDelayMins" : {"$sum" : "$SecurityDelay"},
	  		"lateAircraftDelayMins" : {"$sum" : "$LateAircraftDelay"}}}, 
	  	{"$sort" : {"_id" : 1}}
	])
	results_delayed = db.flights2015.aggregate(pipeline) 


	if i is None:
		filename = filename_base + "_annual" + filename_extension
	else:
		filename = filename_base + "_" + monthNames[i - 1] + filename_extension

	f = open(filename, 'w')
	f.write("RecordType,Origin,Month,CarrierName,Count,ArrDelayMins,Cancellations,CarrierDelayMins,WeatherDelayMins,NasDelayMins,SecurityDelayMins,LateAircraftDelayMins\n")
	for document in results_ontime:
		origin = document['_id']['Origin']
		month = str(document['_id']['Month'])
		carrierCode = document['_id']['Carrier']
		total = str(document['total'])
		arrDelayMins = str(0)
		cancellations = str(document['cancellations'])
		carrierDelayMinutes = str(0)
		weatherDelayMinutes = str(0)
		nasDelayMinutes = str(0)
		securityDelayMinutes = str(0)
		lateAircraftDelayMinutes = str(0)
		carrierName = ""

		if carrierCode in airlineCodes:
			carrierName = airlineCodes[carrierCode]
		else:
			print("Unknown Carrier Code: " + carrierCode)

		print("Writing record to file...")

		f.write("OnTime," + str(origin) + "," + str(month) + "," + carrierName + "," + str(total) + ",0," + str(cancellations) + ",0,0,0,0,0\n")

	for document in results_delayed:
		origin = document['_id']['Origin']
		month = str(document['_id']['Month'])
		carrierCode = document['_id']['Carrier']
		total = str(document['total'])
		arrDelayMins = str(document['arriveDelayMins'])
		cancellations = str(document['cancellations'])
		carrierDelayMinutes = str(document['carrierDelayMins'])
		weatherDelayMinutes = str(document['weatherDelayMins'])
		nasDelayMinutes = str(document['nasDelayMins'])
		securityDelayMinutes = str(document['securityDelayMins'])
		lateAircraftDelayMinutes = str(document['lateAircraftDelayMins'])
		carrierName = ""

		if carrierCode in airlineCodes:
			carrierName = airlineCodes[carrierCode]
		else:
			print("Unknown Carrier Code: " + carrierCode)
		f.write("Delayed," + origin + "," + str(month) + "," + 
			carrierName + "," + str(total) + "," + str(arrDelayMins) + 
			"," + str(cancellations) + "," + str(carrierDelayMinutes) +
			"," + str(weatherDelayMinutes) + "," + str(nasDelayMinutes) +
			"," + str(securityDelayMinutes) + "," + 
			str(lateAircraftDelayMinutes) + "\n")
	f.close()
	print("Wrote output to file: " + filename)
print("Done!")
