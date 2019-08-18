import sys
import telnetlib
import re
import json

# horizons.py target reference type 

HOST = "horizons.jpl.nasa.gov"
PORT = 6775

def parse_ephemerids(elementsString, t):
	elements = {}

	if t == "v":
		D  = re.findall("([0-9]{4}-.*)TDB", elementsString)
		X  = re.findall("X =([-+ .0-9E]*)Y", elementsString)
		Y  = re.findall("Y =([-+ .0-9E]*)Z", elementsString)
		Z  = re.findall("Z =([-+ .0-9E]*)", elementsString)
		VX = re.findall("VX=([-+ .0-9E]*)VY", elementsString)
		VY = re.findall("VY=([-+ .0-9E]*)VZ", elementsString)
		VZ = re.findall("VZ=([-+ .0-9E]*)", elementsString)

		for i in range(len(D)):
			elements[D[i]] = {
				"x" : float(X[i]),
				"y" : float(Y[i]),
				"z" : float(Z[i]),
				"vx": float(VX[i]),
				"vy": float(VY[i]),
				"vz": float(VZ[i])
			}

	elif t == "e":
		D  = re.findall("([0-9]{4}-.*)TDB", elementsString)
		EC  = re.findall("EC=([-+ .0-9E]*)QR", elementsString)
		QR  = re.findall("QR=([-+ .0-9E]*)IN", elementsString)
		IN  = re.findall("IN=([-+ .0-9E]*)", elementsString)
		OM = re.findall("OM=([-+ .0-9E]*)W", elementsString)
		W = re.findall("W =([-+ .0-9E]*)Tp", elementsString)
		Tp = re.findall("Tp=([-+ .0-9E]*)", elementsString)
		N = re.findall("N =([-+ .0-9E]*)MA", elementsString)
		MA = re.findall("MA=([-+ .0-9E]*)TA", elementsString)
		TA = re.findall("TA=([-+ .0-9E]*)", elementsString)		
		A = re.findall("A =([-+ .0-9E]*)AD", elementsString)
		AD = re.findall("AD=([-+ .0-9E]*)PR", elementsString)
		PR = re.findall("PR=([-+ .0-9E]*)", elementsString)

		for i in range(len(D)):
			elements[D[i]] = {
				"ec": float(EC[i]),
				"qr": float(QR[i]),
				"in": float(IN[i]),
				"om": float(OM[i]),
				"w" : float(W[i]),
				"tp": float(Tp[i]),
				"n" : float(N[i]),
				"ma": float(MA[i]),
				"ta": float(TA[i]),
				"a" : float(A[i]),
				"ad": float(AD[i]),
				"pr": float(PR[i])
			}	

	return elements		

def parse_info(infoStr):
	info = {}

	# name = re.findall("([A-Za-z]*) / \(([A-Za-z]*)\)", infoStr)
	# info["name"], info["ref"] = [name[0][i] for i in [0,1]]

	# info["mean_radius"] = float(re.findall("Mean Radius \(km\) *= *([0-9.]*)", infoStr)[0])
	# info["density"] = float(re.findall("Density .* *= *([0-9.]*) ", infoStr)[0])
	# info["mass"] = float(re.findall("Mass \(10\^19 kg\) *= *([0-9.]*)", infoStr)[0])
	# info["albedo"] = float(re.findall("Geometric Albedo *= *([0-9.]*)", infoStr)[0])
	# info["gm"] = float(re.findall("GM \(km\^3/s\^2\) *= *([0-9.]*)", infoStr)[0])
	# info["semi_major_axis"] = re.findall("Semi\-major axis, a \(km\) *= *([0-9.]*\(.*\))", infoStr)[0]
	# info["orbital_period"] = re.findall("Orbital period *= *([0-9.]* *[A-Za-z])", infoStr)[0]
	# info["eccentricity"] = float(re.findall("Eccentricity, e *= *([0-9.]*)", infoStr)[0])
	# info["inclination"] = float(re.findall("Inclination, i  \(deg\) *= *([0-9.]*)", infoStr)[0])

	r = re.findall("[Rr]adius .* *= *([0-9.]*)\+", infoStr)
	if(len(r) > 0):
		info["mean_radius"] = float(r[0])

	return info

def query_state(obj, center, t, step):
	tn = telnetlib.Telnet(HOST, PORT)

	tn.read_until("Horizons> ")
	tn.write(obj + "\n")
	infoString = tn.read_until("Select ... [E]phemeris, [F]tp, [M]ail, [R]edisplay, ?, <cr>: ")
	tn.write("e \n")
	tn.read_until("Observe, Elements, Vectors  [o,e,v,?] : ")

	if t == "e":
		tn.write("e \n")
		tn.read_until("Coordinate system center   [ ###, ? ] : ")
		tn.write(center + "\n")
	elif t == "v":
		tn.write("v \n")
		tn.read_until("Coordinate center [ <id>,coord,geo  ] : ")
		tn.write("@" + center + "\n")

	tn.read_until("Reference plane [eclip, frame, body ] : ")
	tn.write("eclip \n")
	tn.read_until(" : ")
	tn.write("2019-Aug-16 00:00")
	tn.write("\n")
	tn.read_until(" : ")
	tn.write("2019-Aug-17 00:00")	
	tn.write("\n")
	tn.read_until("Output interval [ex: 10m, 1h, 1d, ? ] : ")
	tn.write(step + "\n")
	tn.read_until("Accept default output [ cr=(y), n, ?] : ")
	tn.write("\n")
	headerString = tn.read_until("$$SOE")
	elementsString = tn.read_until("$$EOE")
	footerString = tn.read_until("Author")
	tn.close()

	elements={}
	# elements["type"]=t
	# elements["header"]=headerString
	# elements["footer"]=footerString
	elements["info"]=parse_info(infoString)
	elements["info"]["name"]=obj
	elements["info"]["ref"]=center
	elements["ephemerids"]=parse_ephemerids(elementsString, t)

	return elements

if __name__ == "__main__":

	t = "v"
	d="1d"
	requests = [
		("Sun", "10", "0", t, d),
		("Mercury", "199", "0", t, d),
		("Venus", "299", "0", t, d),
		("Earth", "399", "0", t, d),
		("Mars", "499", "0", t, d),
		("Jupiter", "599", "0", t, d),
		("Saturn", "699", "0", t, d),
		("Uranus", "799", "0", t, d),
		("Neptune", "899", "0", t, d),
		("Pluto", "999", "0", t, d)
	]

	objects = {}

	for d in requests:
		print "Processing : " + d[0]
		objects[d[0]] = query_state(d[1], d[2], d[3], d[4])

	with open('astres.json', 'w') as outfile:
		json.dump(objects, outfile, indent=4)
