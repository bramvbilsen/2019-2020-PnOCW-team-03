export const enum SharedEventTypes {
	NotifyOfTypeChange = "notify-of-type-change"
}

export const enum SlaveEventTypes {
	ChangeBackground = "change-background",
	ChangeOrientationColors = "change-orientation-colors",
	DisplayArrowUp = "display-arrow-up",
	DisplayArrowRight = "display-arrow-right"
}

export const enum MasterEventTypes {
	ChangeSlaveBackgrounds = "change-slave-backgrounds",
	ChangeSlaveBackground = "change-slave-background",
	DisplaySlaveOrientationColors = "display-slave-orientation-colors",
	SlaveChanges = "notify-master-of-slaves",
	SendArrowsUp = "send-arrows-up",
	SendArrowsRight = "send-arrows-right"
}
