/* WorldEngine/Assets/UrbanPlanningSystem.js
 * Multi-District Coastal Urban Spatial Planner:
 *   - Core Coastal Quarter (9 varied historic/civic/mixed-use lots + alleys + plazas)
 *   - North-West Residential Terrace Quarter (distinct villas & gabled courtyard residences)
 *   - North-East Commercial High Street & Civic Clock Plaza
 *   - Continuous Seafront Promenade & Overlook Boardwalk
 *   - West Foothill Coastal Park & Natural Ridge Transition Zone */
(() => {
  const WE = (window.WorldEngine = window.WorldEngine || {});

  WE.planCoastalQuarter = function (M) {
    const lots = [
      // South-West Historic Commercial & Freight Block (split by a 6m cobblestone service alley!)
      {
        x0: -101, z0: -72, x1: -70, z1: -38, mat: M.brickWeathered, h: 11.8,
        style: 'commercial_arcade', era: '1920s_port', use: 'commercial', density: 'medium',
        district: 'core_quarter', variant: 0,
        setback: { n: 1.4, s: 2.0, e: 1.6, w: 1.8 },
        seed: 101, labelZh: '海事货运商业骑楼', labelEn: 'MARITIME COMMERCIAL ARCADE',
      },
      {
        x0: -62, z0: -72, x1: -37, z1: -38, mat: M.concrete, h: 8.2,
        facility: true, style: 'freight_exchange', era: '1910s_industrial', use: 'logistics', density: 'low',
        district: 'core_quarter',
        setback: { n: 2.5, s: 2.5, e: 1.5, w: 1.5 },
      },
      // South-East Precinct 04 Civic-Dispatch Block (kept exact for enterable interior & door tests)
      {
        x0: -15, z0: -72, x1: 16, z1: -38, mat: M.plasterGrey, h: 9.2,
        enterable: true, style: 'dispatch_house', era: '1950s_civic', use: 'dispatch', density: 'medium',
        district: 'core_quarter',
        setback: { n: 1.5, s: 1.5, e: 1.5, w: 1.5 },
      },
      // Mid-West Contemporary Office + 1930s Art-Deco Mixed-Use Block (split by pedestrian lane!)
      {
        x0: -101, z0: -116, x1: -73, z1: -92, mat: M.concreteDirty, h: 18.4,
        style: 'modern_office', era: 'contemporary', use: 'office', density: 'high',
        district: 'core_quarter', variant: 0,
        setback: { n: 1.6, s: 1.8, e: 1.4, w: 1.8 },
        seed: 202, labelZh: '盐线港务大厦', labelEn: 'SALTLINE PORT TOWER',
      },
      {
        x0: -66, z0: -116, x1: -37, z1: -92, mat: M.plasterGrey, h: 14.6,
        style: 'stepped_mixed_use', era: '1930s_deco', use: 'mixed_use', density: 'high',
        district: 'core_quarter', variant: 0,
        setback: { n: 1.5, s: 2.2, e: 1.6, w: 1.5 },
        seed: 309, labelZh: '海湾商住转角楼', labelEn: 'HARBOR CORNER EXCHANGE',
      },
      // Mid-East Civic Customs Hall with Recessed Civic Forecourt Plaza facing the cross-street
      {
        x0: -15, z0: -116, x1: 16, z1: -95, mat: M.concrete, h: 15.2,
        style: 'civic_customs', era: '1910s_civic', use: 'civic', density: 'medium',
        district: 'core_quarter', variant: 0,
        setback: { n: 1.6, s: 1.8, e: 1.8, w: 1.8 },
        seed: 404, labelZh: '东海海关清关署', labelEn: 'EAST SEA CUSTOMS HALL',
      },
      // North-West Historic Bonded Warehouse & Courtyard Apartments (split by narrow rear lane)
      {
        x0: -101, z0: -144, x1: -72, z1: -133, mat: M.brickWeathered, h: 10.6,
        style: 'bonded_warehouse', era: '1890s_masonry', use: 'warehouse', density: 'medium',
        district: 'core_quarter', variant: 0,
        setback: { n: 1.2, s: 1.2, e: 1.4, w: 1.4 },
        seed: 511, labelZh: '老港保税红砖货栈', labelEn: 'OLD PORT BONDED WAREHOUSE',
      },
      {
        x0: -67, z0: -144, x1: -37, z1: -133, mat: M.brickWeathered, h: 13.0,
        style: 'harbor_apartment', era: '1920s_residential', use: 'residential', density: 'high',
        district: 'core_quarter', variant: 0,
        setback: { n: 1.2, s: 1.4, e: 1.5, w: 1.5 },
        seed: 303, labelZh: '滨海船员公寓', labelEn: 'SEAFARER COURTYARD APTS',
      },
      // North-East Staggered Waterfront Terrace Rowhouses (3-unit varied-height residential block)
      {
        x0: -15, z0: -144, x1: 16, z1: -133, mat: M.concreteDirty, h: 9.2,
        style: 'waterfront_rowhouses', era: '1910s_terrace', use: 'residential', density: 'medium',
        district: 'core_quarter', variant: 0,
        setback: { n: 1.0, s: 1.2, e: 1.2, w: 1.2 },
        seed: 612, labelZh: '东海滨海联排民居', labelEn: 'WATERFRONT TERRACE HOUSES',
      },

      // =========================================================================
      // DISTRICT 2: NORTH-WEST RESIDENTIAL TERRACE QUARTER (Independent proportions & variants!)
      // =========================================================================
      {
        x0: -101, z0: -176, x1: -71, z1: -153, mat: M.plasterGrey, h: 9.6,
        style: 'coastal_residence', era: '1930s_residential', use: 'residential', density: 'low',
        district: 'residential_quarter', variant: 1,
        setback: { n: 2.0, s: 2.2, e: 2.0, w: 2.0 },
        seed: 701, labelZh: '西山海景宅邸', labelEn: 'WEST RIDGE COASTAL VILLA',
      },
      {
        x0: -65, z0: -176, x1: -37, z1: -153, mat: M.brickWeathered, h: 12.6,
        style: 'harbor_apartment', era: '1920s_residential', use: 'residential', density: 'medium',
        district: 'residential_quarter', variant: 1,
        setback: { n: 1.6, s: 2.0, e: 1.6, w: 1.6 },
        seed: 719, labelZh: '北湾双山墙庭院公寓', labelEn: 'NORTH BAY GABLED COURTS',
      },

      // =========================================================================
      // DISTRICT 3: NORTH-EAST COMMERCIAL HIGH STREET & CLOCK PLAZA
      // =========================================================================
      {
        x0: -15, z0: -176, x1: 15, z1: -154, mat: M.brickWeathered, h: 12.4,
        style: 'commercial_arcade', era: '1920s_port', use: 'commercial', density: 'high',
        district: 'commercial_plaza', variant: 1,
        setback: { n: 1.4, s: 2.2, e: 1.6, w: 1.6 },
        seed: 805, labelZh: '北港钟楼商业长廊', labelEn: 'NORTH HARBOR CLOCK ARCADE',
      },
    ];

    const plannedLots = lots.map(lot => {
      const sb = lot.setback || { n: 1.8, s: 1.8, e: 1.8, w: 1.8 };
      const width = Math.max(8, (lot.x1 - lot.x0) - (sb.w + sb.e));
      const depth = Math.max(7.2, (lot.z1 - lot.z0) - (sb.n + sb.s));
      const cx = lot.x0 + sb.w + width / 2;
      const cz = lot.z0 + sb.n + depth / 2;
      return { ...lot, width, depth, cx, cz, height: lot.h, styleName: lot.style };
    });

    // Multi-tier road & pedestrian network (extends cleanly into North Residential & Commercial districts)
    const crossStreets = [
      [-104.9, -33.1, -84, 14],  // Secondary commercial cross-street (west)
      [-18.9, 19.9, -84, 14],    // Secondary commercial cross-street (east)
      [-104.9, -33.1, -148.5, 9], // North Residential Terrace Lane
      [-18.9, 19.9, -148.5, 9],   // North Commercial Promenade Street
    ];

    const sidewalks = [
      [-36.8, -72, -33.1, -38],
      [-18.9, -72, -15.1, -38],
      [-101, -76.8, -36.9, -73],
      [-14.8, -76.8, 18, -73],
      [-36.8, -116, -33.1, -92],
      [-18.9, -116, -15.1, -92],
      [-36.8, -176, -33.1, -153],
      [-18.9, -176, -15.1, -153],
    ];

    // Narrow cobblestone pedestrian & service alleys separating buildings organically
    const alleys = [
      { id: 'alley-sw-market', x0: -69.8, z0: -72, x1: -62.4, z1: -38, hasArch: true, label: 'MARKET LANE' },
      { id: 'alley-mw-passage', x0: -72.8, z0: -116, x1: -66.2, z1: -92, hasArch: true, label: 'EXCHANGE PASSAGE' },
      { id: 'alley-nw-bonded', x0: -71.8, z0: -144, x1: -67.2, z1: -133, hasArch: false, label: 'BONDED LANE' },
      { id: 'alley-north-garden', x0: -70.8, z0: -176, x1: -65.2, z1: -153, hasArch: true, label: 'TERRACE WALK' },
    ];

    // Public civic plazas, clock square & waterfront boardwalk promenade
    const plazas = [
      { id: 'customs-forecourt', x0: -15, z0: -95, x1: 16, z1: -91, kind: 'civic_forecourt' },
      { id: 'seafront-pocket', x0: 16.5, z0: -70, x1: 23.0, z1: -42, kind: 'promenade_square' },
      { id: 'north-clock-plaza', x0: -14, z0: -154, x1: 14, z1: -146, kind: 'civic_plaza', landmark: 'clock_obelisk' },
      { id: 'seafront-boardwalk', x0: 17.0, z0: -174, x1: 23.2, z1: -96, kind: 'waterfront_promenade' },
    ];

    // West Foothill Park & Natural Transition Zone bridging urban avenue (-112) to western forested ridge
    const parks = [
      { id: 'west-foothill-park', x0: -144, z0: -114, x1: -120, z1: -48, kind: 'coastal_park' },
    ];

    const greenSpaces = [
      { x: -35.2, z: -41.5, w: 2.0, d: 2.0, treeScale: 0.65 },
      { x: -35.2, z: -68.5, w: 2.0, d: 2.0, treeScale: 0.62 },
      { x: -16.6, z: -40.5, w: 2.0, d: 2.0, treeScale: 0.64 },
      { x: -16.6, z: -69.5, w: 2.0, d: 2.0, treeScale: 0.60 },
      { x: -11.5, z: -93.0, w: 2.6, d: 2.2, treeScale: 0.72 },
      { x: 11.5, z: -93.0, w: 2.6, d: 2.2, treeScale: 0.74 },
      { x: 19.6, z: -56.0, w: 3.2, d: 4.8, treeScale: 0.85 },
      { x: -35.2, z: -102.0, w: 2.0, d: 2.0, treeScale: 0.68 },
      // North Civic Plaza & Waterfront Boardwalk plantings
      { x: -10.5, z: -150.0, w: 2.8, d: 2.4, treeScale: 0.78 },
      { x: 10.5, z: -150.0, w: 2.8, d: 2.4, treeScale: 0.78 },
      { x: 20.2, z: -116.0, w: 2.8, d: 4.0, treeScale: 0.88 },
      { x: 20.2, z: -148.0, w: 2.8, d: 4.0, treeScale: 0.90 },
      // West Foothill Park coastal grove
      { x: -126.0, z: -62.0, w: 4.0, d: 4.0, treeScale: 1.02 },
      { x: -134.0, z: -78.0, w: 4.5, d: 4.5, treeScale: 1.12 },
      { x: -128.0, z: -96.0, w: 4.0, d: 4.0, treeScale: 0.96 },
    ];

    const districts = [
      { id: 'core_quarter', nameZh: '盐线老港核心街区', kind: 'mixed_historic' },
      { id: 'residential_quarter', nameZh: '北湾山景住宅区', kind: 'residential' },
      { id: 'commercial_plaza', nameZh: '北港钟楼商业广场', kind: 'commercial_civic' },
      { id: 'waterfront_promenade', nameZh: '东海滨海步行长廊', kind: 'promenade' },
      { id: 'west_foothill_park', nameZh: '西麓海岸过渡公园', kind: 'natural_park' },
    ];

    return {
      lots: plannedLots,
      crossStreets,
      sidewalks,
      alleys,
      plazas,
      parks,
      greenSpaces,
      districts,
    };
  };
})();
