# Augmenting the UI of an iTwin App

There are two basic ways to augment the UI of a host IModelApp. The first way is for an extension or a package to provide an entire stage definition and call `ConfigurableUiManager.addFrontstageProvider` to register it. A [UiItemsProvider]($appui-abstract) may also need to be registered if the backstage is to be used to activate the frontstage. The second way is to use a `UiItemsProvider` to provide definitions for Tool buttons, Status Bar items, and Widgets to add to an existing frontstage. In this scenario, as frontstage components are constructed at runtime, calls are made to all registered UiItemsProviders to gather item definitions to insert into the host applications UI. The item definitions are sorted and arranged by their itemPriority value.

## Adding ToolButtons, Status Bar items, and Widgets to existing application frontstage

A [UiItemsProvider]($appui-abstract) is used to provide items to insert into the UI of an existing stage. When constructing the stage the UiFramework code will request item definitions from the UiItemsProvider. These calls will always include the current frontstage's Id and usage. An extension can use the info to decide which items to add. The stageId name's used by an application may not be useful unless the extension is just used in a single host app where the stage names are known. The stageUsage value is also provided, this string is typically set to one of the standard [StageUsage]($appui-abstract) enum values.

### Adding a ToolButton

Below is the UiItemsProvider function called when appui-react is populating toolbars.  The [ToolbarUsage]($appui-abstract) will indicate if the toolbar is on the left (content manipulation) or right (view navigation) of the application window. The [ToolbarOrientation]($appui-abstract) specifies if the toolbar is horizontal or vertical.

```ts
public provideToolbarButtonItems(stageId: string, stageUsage: string,
  toolbarUsage: ToolbarUsage, toolbarOrientation: ToolbarOrientation): CommonToolbarItem[]
```

### Status Bar Item

Below is the UiItemsProvider function called when appui-react is populating the status bar footer.

```ts
public provideStatusBarItems(stageId: string, stageUsage: string): CommonStatusBarItem[]
```

### Widget Item

Below is the UiItemsProvider function called when appui-react is populating StagePanels. The [StagePanelLocation]($appui-abstract) will be the default location for the widget. The [StagePanelSection]($appui-abstract) will specify what zone/area in the panel should contain the widget. Since widgets can be moved by the user, the locations specified are only the default locations.

Starting in version 2.17 Widgets can specify if they support being "popped-out" to a child window by setting the AbstractWidgetProps property `canPopout` to true. This option must be explicitly set because the method `getWidgetContent` must return React components that works properly in a child window. At minimum  components should typically not use the `window` or `document` property to register listeners as these listener will be registered for events in the main window and not in the child window. Components will need to use the `ownerDocument` and `ownerDocument.defaultView` properties to retrieve `document` and `window` properties for the child window.

```ts
public provideWidgets(stageId: string, _stageUsage: string, location: StagePanelLocation,
  _section?: StagePanelSection | undefined): ReadonlyArray<AbstractWidgetProps>
```

To see a more complete example of adding ToolButtons, Status Bar items, and Widgets see the [UiItemsProvider example](./abstract/uiitemsprovider/#uiitemsprovider-example).

## Adding a Frontstage

Register [FrontstageProvider]($appui-react)

```ts
ConfigurableUiManager.addFrontstageProvider(new MyFrontstageProvider());
```

Create [UiItemsProvider]($appui-abstract) to provide the backstage entry.

```ts
export class MyUiItemProvider {
  /** id of provider */
  public readonly id = "MyUiItemProvider";
  private static _i18n: I18N;
  constructor(i18n: I18N) {
    MyUiItemProvider.i18n = i18n;
  }

  public provideBackstageItems(): BackstageItem[] {
    const label = MyUiItemProvider._i18n.translate("myExtension:backstage.myFrontstageName");

    return [
      BackstageItemUtilities.createStageLauncher(MyFrontstageProvider.id, 100, 10, label, undefined, undefined),
    ];
  }
}
```

Register the UiItemsProvider.

```ts
UiItemsManager.register(new MyUiItemProvider(IModelApp.i18n));
```

## StateManager and ReducerRegistry

The example below shows the call that adds a Reducer to the store managed by the StateManager. This registration should be made by the extension when it loads or by a package when it is initialized.

```ts
ReducerRegistryInstance.registerReducer(
  ExtensionStateManager._reducerName,
  ExtensionStateManager.reducer,
);
```

See complete [example](./framework/state/#example-of-defining-dynamic-reducer-needed-by-a-plugin).
