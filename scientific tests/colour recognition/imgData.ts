export interface IData {
    brightness: number;
    phone_id: number;
    percentage_screen: number;
    distance: number;
    color_amount: number;
    colors: number[];  
    light_type: number;
    reflection_type: number;
    screen_type: number;
    identifier: number;
}

export enum reflectionType {
    REFLECTION,
    NO_REFLECTION
}
export enum lightType {
    NO_LIGHT,
    ARTIFICIAL_LIGHT,
    NATURAL_LIGHT
}