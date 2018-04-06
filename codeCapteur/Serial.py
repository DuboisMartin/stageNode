import serial
import mysql.connector
import atexit

def exit_handler():
    cnx.close()
    print('DB closed')
atexit.register(exit_handler)

#Ouverture port série
ser = serial.Serial('/dev/ttyACM0', 9600)
#Connexion database
#cnx = mysql.connector.connect(user='test', password='', host='localhost', database='test')
cnx = mysql.connector.connect(user='test', password='mis', host='159.65.84.177', database='test')
cursor = cnx.cursor()
 

while True:
    string = ser.readline().decode("utf8")[:-2]
    print(string)
    print("INSERT INTO t1 VALUES(0, \'"+string+"\');")
    cursor.execute("INSERT INTO t1 VALUES(0, \'"+string+"\');")
    