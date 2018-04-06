import mysql
cnx = mysql.connector.connect(user='test', password='', host='localhost', database='test')
cnx.close()
