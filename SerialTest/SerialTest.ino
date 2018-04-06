int val = 0;

void setup() {
  Serial.begin(9600);
  randomSeed(analogRead(0));
}


void loop() {
  val = random(1023);
  Serial.println(val);
  delay(30000);
}
