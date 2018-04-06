int potPin = 0;
int ledPin = 13;
int val = 0;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}


void loop() {
  val = analogRead(potPin);
  Serial.println(val);
  delay(1000);
}
