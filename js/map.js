// Studes — map.js
// Interactive map on the contact page using Leaflet (external library) and OpenStreetMap tiles.
// Shows the three Studes offices, a 3 km service area around each, and the distance between the two main offices.

(function () {
  'use strict';

  const OFFICES = [
    { id: 'braamfontein', name: 'Studes Braamfontein', city: 'Johannesburg', address: 'Near Wits University, Braamfontein', lat: -26.1929, lng: 28.0305 },
    { id: 'hatfield', name: 'Studes Hatfield', city: 'Pretoria', address: 'Near the University of Pretoria, Hatfield', lat: -25.7545, lng: 28.2314 },
    { id: 'auckland-park', name: 'Studes Auckland Park', city: 'Johannesburg', address: 'Near the University of Johannesburg, Auckland Park', lat: -26.1825, lng: 28.0000 }
  ];

  /* Great-circle distance in kilometres (haversine formula) */
  function distanceKm(a, b) {
    const toRad = function (d) { return d * Math.PI / 180; };
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  window.StudesMap = { OFFICES: OFFICES, distanceKm: distanceKm };

  document.addEventListener('DOMContentLoaded', function () {
    const mapEl = document.getElementById('office-map');
    if (!mapEl) return;
    const fallback = document.getElementById('map-fallback');

    // If the Leaflet library did not load (offline, blocked), show the plain directions links instead
    if (typeof L === 'undefined') {
      if (fallback) fallback.hidden = false;
      mapEl.hidden = true;
      return;
    }

    const map = L.map(mapEl, { scrollWheelZoom: false }).setView([-26.0, 28.15], 9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const markers = {};
    OFFICES.forEach(function (o) {
      const icon = L.divIcon({ className: 'office-pin', html: '<span></span>', iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -30] });
      const marker = L.marker([o.lat, o.lng], { icon: icon, title: o.name, alt: o.name }).addTo(map);

      // Popup built from DOM nodes (not an HTML string)
      const pop = document.createElement('div');
      const h = document.createElement('strong');
      h.textContent = o.name;
      const p = document.createElement('p');
      p.textContent = o.address;
      const a = document.createElement('a');
      a.href = 'https://www.google.com/maps/dir/?api=1&destination=' + o.lat + ',' + o.lng;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = 'Get directions';
      pop.appendChild(h);
      pop.appendChild(p);
      pop.appendChild(a);
      marker.bindPopup(pop);
      markers[o.id] = marker;

      L.circle([o.lat, o.lng], { radius: 3000, color: '#0b3d91', weight: 1, fillColor: '#0b3d91', fillOpacity: 0.08 }).addTo(map);
    });

    const jhb = OFFICES[0];
    const pta = OFFICES[1];
    L.polyline([[jhb.lat, jhb.lng], [pta.lat, pta.lng]], { color: '#f28c28', weight: 3, dashArray: '8 8' }).addTo(map);
    map.fitBounds(OFFICES.map(function (o) { return [o.lat, o.lng]; }), { padding: [40, 40] });

    const dist = document.getElementById('office-distance');
    if (dist) dist.textContent = 'The Braamfontein and Hatfield offices are about ' + Math.round(distanceKm(jhb, pta)) + ' km apart in a straight line.';

    // "Show on map" buttons beside each office card
    document.querySelectorAll('[data-office]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const o = OFFICES.find(function (x) { return x.id === btn.dataset.office; });
        if (!o) return;
        map.setView([o.lat, o.lng], 14);
        markers[o.id].openPopup();
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  });
})();
