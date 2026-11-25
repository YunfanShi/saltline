(() => {
  const WE = window.WorldEngine = window.WorldEngine || {};
  WE.planCoastalQuarter = function (M) {
    const lots = [
      { x0: -98, z0: -72, x1: -66, z1: -38, mat: M.brickWeathered, h: 11.5, style: 'commercial_arcade', seed: 101, labelZh: '海事货运商业骑楼', labelEn: 'MARITIME COMMERCIAL ARCADE' },
      { x0: -62, z0: -72, x1: -37, z1: -38, mat: M.concrete, h: 8.2, facility: true, style: 'freight_exchange' },
      { x0: -15, z0: -72, x1: 16, z1: -38, mat: M.plasterGrey, h: 9.2, enterable: true, style: 'dispatch_house' },
      { x0: -98, z0: -115, x1: -68, z1: -93, mat: M.concreteDirty, h: 18.2, style: 'modern_office', seed: 202, labelZh: '盐线港务大厦', labelEn: 'SALTLINE PORT TOWER' },
      { x0: -64, z0: -115, x1: -37, z1: -93, mat: M.brickWeathered, h: 13.0, style: 'harbor_apartment', seed: 303, labelZh: '滨海船员公寓', labelEn: 'SEAFARER COURTYARD APTS' },
      { x0: -15, z0: -115, x1: 16, z1: -93, mat: M.concrete, h: 15.2, style: 'civic_customs', seed: 404, labelZh: '东海海关清关署', labelEn: 'EAST SEA CUSTOMS HALL' },
      { x0: -96, z0: -143, x1: -40, z1: -134, mat: M.brickWeathered, h: 9.4, style: 'industrial_hall', seed: 505, labelZh: '北港锯齿机电工坊', labelEn: 'NORTH PORT SAWTOOTH WORKS' },
      { x0: -15, z0: -143, x1: 16, z1: -134, mat: M.concreteDirty, h: 8.8, style: 'coastal_residence', seed: 606, labelZh: '东海海岸排屋民居', labelEn: 'COASTAL TERRACE RESIDENCE' },
    ];
    // Surveyed frontage and setbacks preserve service access behind each building.
    const plannedLots = lots.map(lot => {
      const width = lot.x1 - lot.x0 - 3.6;
      const depth = lot.z1 - lot.z0 - 3.6;
      const cx = (lot.x0 + lot.x1) / 2;
      const cz = (lot.z0 + lot.z1) / 2;
      return { ...lot, width, depth, cx, cz, height: lot.h, styleName: lot.style };
    });
    return {
      lots: plannedLots,
      crossStreets: [[-104.9,-33.1,-84,14],[-18.9,19.9,-84,14]],
      sidewalks: [[-36.8,-72,-33.1,-38],[-18.9,-72,-15.1,-38],
        [-100,-76.8,-36.9,-73],[-14.8,-76.8,18,-73]]
    };
  };
})();
