setwd("C:/Users/Pieter-Jan/Documents/KULeuven/3de Bach/PenO/Own work/Test Colour Recognition")

library(png)

img <- readPNG("Sunset.png")
rgbRef = c(255,0,0,255)

rVal = c()
gVal = c()
bVal = c()

for(i in 1:453) {
  for (j in 1:237) {
    rgb = img[1,1,] * 255
    
    a = rgb[1]
    rVal = c(rVal, a)
  }
}


# Clear environment
rm(list=ls())
