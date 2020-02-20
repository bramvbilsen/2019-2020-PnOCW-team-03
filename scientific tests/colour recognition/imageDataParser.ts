import {IData, reflectionType, lightType} from "./imgData"

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
    console.log("startd");
    console.log(splitted);
    const imgData = <IData> {};
    imgData.brightness = parseInt(splitted[0]);
    imgData.phone_id = parseInt(splitted[1]);
    imgData.percentage_screen = parseInt(splitted[2]);
    imgData.color_amount = parseInt(splitted[3]);
    let amount = imgData.color_amount;
    let counter = 0;
    imgData.colors = [];
    while (amount > 0) {
        imgData.colors.push(parseInt(splitted[4+counter]));
        imgData.colors.push(parseInt(splitted[4+counter+1]));
        imgData.colors.push(parseInt(splitted[4+counter+2]));
        counter += 3;
        amount -= 1;
    }
    let newIndex = 4 + counter;
    switch (parseInt(splitted[newIndex++])) {  
        case 0:  
         imgData.light_type = lightType.NO_LIGHT;  
         break;  
        case 1:  
         imgData.light_type = lightType.ARTIFICIAL_LIGHT; ;  
         break; 
        case 2:  
         imgData.light_type = lightType.NATURAL_LIGHT; ;  
         break; 
       }  
    imgData.light_type = parseInt(splitted[newIndex++]);
    switch (parseInt(splitted[newIndex++])) {  
        case 0:  
         imgData.reflection_type = reflectionType.NO_REFLECTION;  
         break;  
        case 1:  
        imgData.reflection_type = reflectionType.REFLECTION; ;  
         break; 
       }  
    imgData.screen_type = parseInt(splitted[newIndex++]);
    imgData.identifier = parseInt(splitted[newIndex]);

    console.log("brightness: " + imgData.brightness);
    console.log("phone_id: " + imgData.phone_id);
    console.log("percentage_screen: " + imgData.percentage_screen);
    console.log("color_amount: " + imgData.color_amount);
    console.log("colors: " + imgData.colors);
    console.log("reflection_type: " + imgData.reflection_type);
    console.log("screen_id: " + imgData.screen_type);
    console.log("identifier: " + imgData.identifier);

    for (let i = 0; i < splitted.length; i++) {
        //console.log("chillzzz");
        
    }
 }

 dataParse("25_2_80_3_255_255_255_255_255_244_1_1_1_0_0_1_3_11");

