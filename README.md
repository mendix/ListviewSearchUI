# ListviewSearchUI
Provides an extension of the searchfield of a listview: show/hide functionality as well as moving the searchfield to a different location.

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!

## Description

The ListviewSearchUI widget provides a workaround for showing / hiding and changing the location of a standard Mendix Listview Searchfield. 

## Important: Use with extra care

Take care in using this widget. Altering native Mendix widgets like the listview is definitely not on the list of recommended things to do. The risks of doing this is creating unknown usecases with uncertain outcomes. It can no longer be garanteed that the original Listview will still function properly in every usecase. It is for this reason that this widget can have no real support other than community support on the contents of this widget itself. No Appstore version will hence be created.

## Modes

- Button mode (default):
  Creates a button that shows or hides the listviews searchfield.
- Position mode:
  Moves the listviews searchbar node to the custom widgets node.
- Full mode:
  Both creates the button for show/hide as well as moves the searchbar

## Settings
- Target listview: enter the "name" property of the listview you want to target.
- Widget mode: select the wanted mode
- Hide search on start: if set to true, the listviews searchbar will be hidden on start.
- Button label: if the show/hide functionality is active, an optional string can be used as button label
- Button icon: by default this is the glyphicon search icon, you can alter this by entering a different bootstrap icon class.


## Implementation steps

1. Either insert the custom widget in a page or in a navigation layout.
2. Use a logical name for the listview you want to alter.
3. Enter that logical name as the Target listview.

## Notes
The widget is designed for single listview usage per page. Meaning the widget, if used in a navigation layout, can target multiple listviews on multiple pages as long as they have the same name.

Note that if a listview doesn't exist or doesn't have a searchbar due to e.g. microflow data source, the custom widget will get a Bootstrap "hidden" class and will not be visible.

If the listview and custom widget are not in the same layoutcontainer, issues could arise with calculating heights of those layoutcontainer. These will lead to unwanted sizes of the layoutcontainer when opening and closing the searchpanel. The solution for this is to use absolute positioning for the searchfield use the extra classes on the listview to account for extra room.

## Compatibility
The widget was created in Mendix version 5.19 but it should work from 5.14.1 onwards although untested.
The latest Mendix version it was tested in is version 6.2 so Mendix 6 is compatible.

## Release Notes
1.1.1 Github release:
- added classes to listview for optional css layout fixes.

1.1 Github release:
- added two missing modes for when no listview or searchfield exists. "disabled" or the older "hide"
- added tabindex of -1 for the searchbutton to avoid focus on page load.

1.0 Github release:
- first version of the custom widget.
