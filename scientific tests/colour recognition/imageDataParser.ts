/**
 * Parse the metdata from the pictures to easily
 * understandable data
 * 
 * Info: Voorbeeld bestandsnaam: 25_5_70_100_2_255_255_0_100_100_100_1_1_3_2333.jpg
 --> helderheid van het scherm op de foto is 25%, gsm 5 van dit team, 70% van de pixels
 van de foto zijn pixels van het scherm, de afstand tussen het scherm en de camera is 100cm,
 er zijn 2 kleuren te zien op het scherm, de eerste kleur (van links naar rechts) is de kleur 
 met RGB waarden 255,255,0, de tweede kleur heeft RGB waarden 100,100,100, er is artificieel licht,
 er is lichtreflectie op het scherm, de foto is van scherm 3 van dit team en de identifier van deze
 foto is 2333. 
 */

 function dataParse(data: string) {
    let splitted = data.split("_");
    for (let i = 0; i++; i < 10) {
        let current = splitted[i];
        console.log(current);
    }
 }



