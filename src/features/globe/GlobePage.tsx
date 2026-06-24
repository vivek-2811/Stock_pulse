import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe, MapPin, ExternalLink, RefreshCw } from 'lucide-react';

interface Exchange {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  indexName: string;
  indexPrice: number;
  indexChange: number;
  indexPct: number;
  timezone: string;
  volume24h: string;
  status: 'Open' | 'Closed';
}

export const GlobePage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedExchangeId, setSelectedExchangeId] = useState<string>('nyse');
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const manualRotation = useRef({ x: 0, y: 0 });
  const autoRotate = useRef(true);

  const exchanges: Exchange[] = [
    {
      id: 'nyse',
      name: 'New York Stock Exchange',
      city: 'New York',
      country: 'United States',
      lat: 40.7128,
      lon: -74.0060,
      indexName: 'S&P 500',
      indexPrice: 5431.60,
      indexChange: 25.40,
      indexPct: 0.47,
      timezone: 'EST (UTC -5)',
      volume24h: '$32.4 Billion',
      status: 'Open'
    },
    {
      id: 'lse',
      name: 'London Stock Exchange',
      city: 'London',
      country: 'United Kingdom',
      lat: 51.5074,
      lon: -0.1278,
      indexName: 'FTSE 100',
      indexPrice: 8245.30,
      indexChange: -12.40,
      indexPct: -0.15,
      timezone: 'GMT (UTC +0)',
      volume24h: '$6.8 Billion',
      status: 'Closed'
    },
    {
      id: 'jpx',
      name: 'Japan Exchange Group',
      city: 'Tokyo',
      country: 'Japan',
      lat: 35.6762,
      lon: 139.6503,
      indexName: 'Nikkei 225',
      indexPrice: 38590.20,
      indexChange: 412.50,
      indexPct: 1.08,
      timezone: 'JST (UTC +9)',
      volume24h: '$12.1 Billion',
      status: 'Closed'
    },
    {
      id: 'fsx',
      name: 'Frankfurt Stock Exchange',
      city: 'Frankfurt',
      country: 'Germany',
      lat: 50.1109,
      lon: 8.6821,
      indexName: 'DAX Index',
      indexPrice: 18125.60,
      indexChange: 98.40,
      indexPct: 0.55,
      timezone: 'CET (UTC +1)',
      volume24h: '$5.4 Billion',
      status: 'Closed'
    },
    {
      id: 'asx',
      name: 'Australian Securities Exchange',
      city: 'Sydney',
      country: 'Australia',
      lat: -33.8688,
      lon: 151.2093,
      indexName: 'ASX 200',
      indexPrice: 7795.40,
      indexChange: -42.80,
      indexPct: -0.55,
      timezone: 'AEST (UTC +10)',
      volume24h: '$3.9 Billion',
      status: 'Open'
    }
  ];

  const activeExchange = exchanges.find(ex => ex.id === selectedExchangeId) || exchanges[0];

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = null;

    // ── Camera ──
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.z = 200;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // ── Texture Loader ──
    const loader = new THREE.TextureLoader();

    const globeRadius = 70;

    // ── Stars background ──
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 2000;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ── Globe group ──
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // ── Earth texture (using a free public CDN tile) ──
    // We build the Earth look procedurally since we can't fetch external textures reliably
    // Use canvas to paint a realistic-looking Earth surface
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, '#0c1a3a');
    oceanGrad.addColorStop(0.3, '#0d2447');
    oceanGrad.addColorStop(0.7, '#0d2447');
    oceanGrad.addColorStop(1, '#0c1a3a');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    // Draw simplified continents as landmasses
    ctx.fillStyle = '#1a3a1a';

    // North America
    ctx.beginPath();
    ctx.moveTo(120, 80);
    ctx.lineTo(220, 70);
    ctx.lineTo(260, 100);
    ctx.lineTo(270, 160);
    ctx.lineTo(240, 210);
    ctx.lineTo(200, 240);
    ctx.lineTo(160, 280);
    ctx.lineTo(130, 300);
    ctx.lineTo(100, 270);
    ctx.lineTo(80, 230);
    ctx.lineTo(90, 160);
    ctx.lineTo(110, 120);
    ctx.closePath();
    ctx.fill();

    // South America
    ctx.beginPath();
    ctx.moveTo(170, 300);
    ctx.lineTo(220, 290);
    ctx.lineTo(240, 320);
    ctx.lineTo(235, 380);
    ctx.lineTo(210, 420);
    ctx.lineTo(185, 440);
    ctx.lineTo(165, 400);
    ctx.lineTo(155, 360);
    ctx.lineTo(158, 320);
    ctx.closePath();
    ctx.fill();

    // Europe
    ctx.beginPath();
    ctx.moveTo(440, 70);
    ctx.lineTo(510, 65);
    ctx.lineTo(530, 90);
    ctx.lineTo(520, 130);
    ctx.lineTo(490, 150);
    ctx.lineTo(460, 145);
    ctx.lineTo(440, 130);
    ctx.lineTo(435, 100);
    ctx.closePath();
    ctx.fill();

    // Africa
    ctx.beginPath();
    ctx.moveTo(450, 160);
    ctx.lineTo(530, 155);
    ctx.lineTo(560, 190);
    ctx.lineTo(555, 260);
    ctx.lineTo(530, 320);
    ctx.lineTo(500, 370);
    ctx.lineTo(475, 375);
    ctx.lineTo(450, 340);
    ctx.lineTo(435, 270);
    ctx.lineTo(432, 200);
    ctx.closePath();
    ctx.fill();

    // Asia
    ctx.beginPath();
    ctx.moveTo(540, 65);
    ctx.lineTo(730, 60);
    ctx.lineTo(800, 80);
    ctx.lineTo(820, 120);
    ctx.lineTo(790, 170);
    ctx.lineTo(740, 200);
    ctx.lineTo(680, 220);
    ctx.lineTo(620, 215);
    ctx.lineTo(570, 185);
    ctx.lineTo(550, 150);
    ctx.lineTo(535, 110);
    ctx.closePath();
    ctx.fill();

    // India
    ctx.beginPath();
    ctx.moveTo(610, 195);
    ctx.lineTo(660, 190);
    ctx.lineTo(670, 250);
    ctx.lineTo(640, 290);
    ctx.lineTo(615, 280);
    ctx.lineTo(600, 240);
    ctx.closePath();
    ctx.fill();

    // Australia
    ctx.beginPath();
    ctx.moveTo(720, 300);
    ctx.lineTo(820, 290);
    ctx.lineTo(860, 330);
    ctx.lineTo(855, 390);
    ctx.lineTo(810, 415);
    ctx.lineTo(750, 415);
    ctx.lineTo(710, 385);
    ctx.lineTo(700, 340);
    ctx.closePath();
    ctx.fill();

    // Greenland
    ctx.beginPath();
    ctx.moveTo(230, 40);
    ctx.lineTo(290, 30);
    ctx.lineTo(310, 60);
    ctx.lineTo(290, 90);
    ctx.lineTo(250, 95);
    ctx.lineTo(225, 70);
    ctx.closePath();
    ctx.fill();

    // Ice caps at poles
    ctx.fillStyle = 'rgba(200,220,255,0.4)';
    ctx.fillRect(0, 0, 1024, 30);
    ctx.fillRect(0, 482, 1024, 30);

    // Subtle ocean shimmer — latitude lines
    ctx.strokeStyle = 'rgba(30,80,160,0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (512 / 8) * i);
      ctx.lineTo(1024, (512 / 8) * i);
      ctx.stroke();
    }
    for (let i = 1; i < 16; i++) {
      ctx.beginPath();
      ctx.moveTo((1024 / 16) * i, 0);
      ctx.lineTo((1024 / 16) * i, 512);
      ctx.stroke();
    }

    // City lights overlay (tiny bright dots in populated areas)
    const cityDots = [
      [130, 155], [170, 200], [460, 90], [490, 95], [550, 100],
      [610, 195], [720, 130], [730, 150], [700, 115], [800, 290],
      [190, 300], [510, 175], [540, 180]
    ];
    cityDots.forEach(([cx, cy]) => {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 6);
      g.addColorStop(0, 'rgba(255,220,100,0.6)');
      g.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - 6, cy - 6, 12, 12);
    });

    const earthTexture = new THREE.CanvasTexture(canvas);

    // ── Earth sphere ──
    const sphereGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      map: earthTexture,
      specular: new THREE.Color(0x1a3a6a),
      shininess: 18,
      transparent: false,
    });
    const globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
    globeGroup.add(globe);

    // ── Atmosphere glow (outer shell) ──
    const atmosGeometry = new THREE.SphereGeometry(globeRadius + 3, 64, 64);
    const atmosMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a6aff,
      transparent: true,
      opacity: 0.06,
      side: THREE.FrontSide,
    });
    const atmosphere = new THREE.Mesh(atmosGeometry, atmosMaterial);
    globeGroup.add(atmosphere);

    // Outer halo
    const haloGeometry = new THREE.SphereGeometry(globeRadius + 7, 32, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x1144cc,
      transparent: true,
      opacity: 0.04,
      side: THREE.BackSide,
    });
    globeGroup.add(new THREE.Mesh(haloGeometry, haloMaterial));

    // ── Lights ──
    // Sunlight from upper-right
    const sunLight = new THREE.DirectionalLight(0xfff4e0, 2.2);
    sunLight.position.set(200, 100, 150);
    scene.add(sunLight);

    // Ambient fill so dark side isn't pitch black
    const ambientLight = new THREE.AmbientLight(0x0a1535, 2.5);
    scene.add(ambientLight);

    // Blue rim light from opposite side (space glow)
    const rimLight = new THREE.DirectionalLight(0x2244ff, 0.5);
    rimLight.position.set(-150, -50, -100);
    scene.add(rimLight);

    // ── lat/lon → 3D ──
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.sin(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);
      return new THREE.Vector3(x, y, z);
    };

    // ── Exchange pins ──
    const pinGroup = new THREE.Group();
    globe.add(pinGroup);

    exchanges.forEach(ex => {
      const pos = latLonToVector3(ex.lat, ex.lon, globeRadius + 0.5);

      // Glowing dot
      const dotGeo = new THREE.SphereGeometry(1.4, 12, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x00FF87 });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      pinGroup.add(dot);

      // Pulse ring 1
      const ring1Geo = new THREE.RingGeometry(2.2, 2.8, 24);
      const ring1Mat = new THREE.MeshBasicMaterial({
        color: 0x00FF87,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.position.copy(pos);
      ring1.lookAt(new THREE.Vector3(0, 0, 0));
      pinGroup.add(ring1);

      // Pulse ring 2 (larger, dimmer)
      const ring2Geo = new THREE.RingGeometry(3.5, 4.2, 24);
      const ring2Mat = new THREE.MeshBasicMaterial({
        color: 0x00FF87,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.25,
      });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.position.copy(pos);
      ring2.lookAt(new THREE.Vector3(0, 0, 0));
      pinGroup.add(ring2);
    });

    // ── Mouse drag ──
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      autoRotate.current = false;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      manualRotation.current.y += dx * 0.005;
      manualRotation.current.x += dy * 0.005;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging.current = false; };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // ── Animation ──
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (autoRotate.current) {
        globeGroup.rotation.y += 0.0008;
      } else {
        globeGroup.rotation.y = manualRotation.current.y;
        globeGroup.rotation.x = Math.max(-0.5, Math.min(0.5, manualRotation.current.x));
      }

      // Pulse rings
      const pulse = 1 + Math.sin(t * 2.5) * 0.25;
      let ringIdx = 0;
      pinGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          const geo = child.geometry;
          if (geo instanceof THREE.RingGeometry) {
            if (ringIdx % 2 === 1) {
              child.scale.setScalar(pulse);
              const mat = child.material as THREE.MeshBasicMaterial;
              mat.opacity = 0.25 + Math.sin(t * 2.5 + ringIdx) * 0.15;
            }
            ringIdx++;
          }
        }
      });

      // Atmosphere shimmer
      const atmoPulse = 0.06 + Math.sin(t * 0.5) * 0.01;
      (atmosMaterial as THREE.MeshPhongMaterial).opacity = atmoPulse;

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ──
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mousedown', onMouseDown);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      earthTexture.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] min-h-[500px]">

      {/* 3D WebGL Globe Canvas Box */}
      <div className="lg:col-span-2 glass-card rounded-3xl border border-border-glass relative overflow-hidden flex flex-col justify-between p-6 bg-surface-lowest/20 min-h-[350px]">
        {/* Overlay Label */}
        <div className="absolute top-6 left-6 z-10 space-y-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Globe className="w-4.5 h-4.5 text-app-green animate-pulse" /> 3D Global Liquidity Globe
          </h2>
          <span className="text-[10px] text-[#8A8F98] block">Click & drag to rotate · Select an exchange to highlight.</span>
        </div>

        {/* Canvas Mount */}
        <div
          ref={mountRef}
          className="w-full h-full flex-1 cursor-grab active:cursor-grabbing"
          style={{ minHeight: 300 }}
        />

        {/* Active Pins Quick Toolbar */}
        <div className="flex flex-wrap gap-1.5 z-10 bg-surface-low/80 p-2 rounded-2xl border border-border-glass max-w-fit self-center">
          {exchanges.map(ex => (
            <button
              key={ex.id}
              onClick={() => setSelectedExchangeId(ex.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                selectedExchangeId === ex.id
                  ? 'bg-app-green text-black shadow-glow-green-sm'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {ex.city}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Exchange Detail Analytics Panel */}
      <div className="glass-card rounded-3xl p-6 border border-border-glass flex flex-col justify-between lg:col-span-1 space-y-6">
        <div className="space-y-5">
          <div className="pb-3.5 border-b border-border-glass flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">{activeExchange.country}</span>
              <h2 className="text-lg font-bold text-white mt-0.5">{activeExchange.name}</h2>
              <span className="text-[10px] text-text-muted mt-1 block flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#FF3B5C]" /> {activeExchange.city} ({activeExchange.timezone})
              </span>
            </div>

            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              activeExchange.status === 'Open'
                ? 'bg-app-green/15 text-app-green border border-app-green/20'
                : 'bg-white/5 text-text-muted border border-border-glass'
            }`}>
              {activeExchange.status}
            </span>
          </div>

          {/* Indices info */}
          <div className="space-y-3.5">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Benchmark Index status</h3>
            <div className="p-4 rounded-xl bg-surface-lowest border border-border-glass/40 flex justify-between items-center">
              <div>
                <span className="font-bold text-sm text-white block">{activeExchange.indexName}</span>
                <span className="text-[10px] text-text-muted font-mono block mt-0.5">${activeExchange.indexPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="text-right font-mono">
                <span className={`text-xs font-bold block ${activeExchange.indexChange >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                  {activeExchange.indexChange >= 0 ? '+' : ''}{activeExchange.indexChange.toFixed(2)}
                </span>
                <span className={`text-[10px] block mt-0.5 ${activeExchange.indexPct >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                  {activeExchange.indexPct >= 0 ? '+' : ''}{activeExchange.indexPct.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Ticker metrics */}
          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between py-2 border-b border-border-glass/20">
              <span className="text-text-muted">Exchange Volume (24h)</span>
              <span className="font-bold text-white">{activeExchange.volume24h}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-glass/20">
              <span className="text-text-muted">Settlement Currency</span>
              <span className="font-bold text-white">{activeExchange.id === 'nyse' ? 'USD' : activeExchange.id === 'lse' ? 'GBP' : activeExchange.id === 'jpx' ? 'JPY' : activeExchange.id === 'fsx' ? 'EUR' : 'AUD'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-glass/20">
              <span className="text-text-muted">Liquidity Class</span>
              <span className="font-bold text-app-green uppercase">Tier-1 Global</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-glass/20">
              <span className="text-text-muted">Coordinates</span>
              <span className="font-bold text-white">{activeExchange.lat.toFixed(2)}°, {activeExchange.lon.toFixed(2)}°</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-border-glass/35 flex items-center justify-between text-xs text-app-green font-bold">
          <span className="flex items-center gap-1 cursor-pointer hover:underline">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Live Ticker Enabled
          </span>
          <a href="#" className="flex items-center gap-1 hover:underline">
            Exchange Rules <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
};
export default GlobePage;
