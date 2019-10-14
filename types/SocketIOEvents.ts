export const enum SharedEventTypes {
	NotifyOfTypeChange = "notify-of-type-change"
}

export const enum SlaveEventTypes {
	ChangeBackground = "change-background"
}

export const enum MasterEventTypes {
	ChangeSlaveBackgrounds = "change-slave-backgrounds",
	SlaveChanges = "notify-master-of-slaves"
}
