/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { expect } from "chai";
import { BackgroundMapProps, BackgroundMapSettings, BackgroundMapType, GlobeMode, TerrainHeightOriginMode } from "@bentley/imodeljs-common";
import { IModelApp, IModelConnection, SnapshotConnection } from "@bentley/imodeljs-frontend";
import { testOnScreenViewport, TestViewport } from "../TestViewport";

describe("Background map", () => {
  let imodel: IModelConnection;

  before(async () => {
    await IModelApp.startup({
      renderSys: {
        // Test wants to read the color of exactly one pixel, specified in CSS pixels. Ignore device pixel ratio.
        dpiAwareViewports: false,
      },
    });

    imodel = await SnapshotConnection.openFile("mirukuru.ibim");
  });

  after(async () => {
    if (imodel)
      await imodel.close();

    await IModelApp.shutdown();
  });

  it("produces a different tile tree when background map settings change", async () => {
    async function isSameTileTree(vp: TestViewport, props: BackgroundMapProps): Promise<boolean> {
      expect(vp.viewFlags.backgroundMap).to.be.true;
      await vp.waitForAllTilesToRender();
      const prevTree = vp.backgroundMap!.treeOwner.tileTree!;
      expect(prevTree).not.to.be.undefined;

      vp.changeBackgroundMapProps(props);
      await vp.waitForAllTilesToRender();
      const newTree = vp.backgroundMap!.treeOwner.tileTree!;
      expect(newTree).not.to.be.undefined;

      return newTree === prevTree;
    }

    type Test = [ BackgroundMapProps, boolean ]; // true if expect same tile tree after changing background map props
    const tests: Test[] = [
      [ {}, true ],
      [ BackgroundMapSettings.fromJSON().toJSON(), true ],
      [ { useDepthBuffer: true }, false ],
      [ { groundBias: 100 }, false ],
      [ { groundBias: 0 }, false ],
      [ { transparency: 0.5 }, false ],
      [ { globeMode: GlobeMode.Plane }, false ],

      // Terrain-specific settings don't affect tile tree if terrain is disabled.
      [ { terrainSettings: { exaggeration: 42 } }, true ],
      [ { terrainSettings: { heightOrigin: 21 } }, true ],
      [ { terrainSettings: { heightOriginMode: TerrainHeightOriginMode.Ground } }, true ],

      // Terrain enabled.
      /* ###TODO ApproximateTerrainHeights.json supplied by imodeljs-frontend is not found...
      [ { applyTerrain: true }, false ],
      [ { applyTerrain: true, terrainSettings: { exaggeration: 0 } }, false ],
      [ { applyTerrain: true, terrainSettings: { heightOrigin: 0 } }, false ],
      [ { applyTerrain: true, terrainSettings: { heightOriginMode: TerrainHeightOriginMode.Geodetic } }, false ],

      // Settings specific to flat map don't affect tile tree if terrain is enabled.
      [ { applyTerrain: true, groundBias: 42 }, true ],
      [ { applyTerrain: true, useDepthBuffer: false }, true ],
      */
    ];

    await testOnScreenViewport("0x24", imodel, 100, 100, async (vp) => {
      vp.viewFlags = vp.viewFlags.with("backgroundMap", true);

      for (const test of tests) {
        expect(await isSameTileTree(vp, test[0])).to.equal(test[1]);
        expect(await isSameTileTree(vp, test[0])).to.be.true;
      }
    });
  });

});
