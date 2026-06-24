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

  // Three.js animation setup
  useEffect(() => {
    if (!mountRef.current) return;

    // Get dimensions
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 250;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Light
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00FF94, 2, 300);
    pointLight.position.set(100, 100, 100);
    scene.add(pointLight);

    // Globe Sphere Geometry
    const globeRadius = 60;
    const sphereGeometry = new THREE.SphereGeometry(globeRadius, 32, 32);
    
    // Wireframe wire mesh
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });

    const globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(globe);

    // Add solid core inner sphere for depth
    const coreGeometry = new THREE.SphereGeometry(globeRadius - 0.5, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0e14,
      transparent: true,
      opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    globe.add(core);

    // Add grid helpers on top
    const gridGeometry = new THREE.SphereGeometry(globeRadius + 0.2, 16, 16);
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00FF94,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    globe.add(grid);

    // Map latitude/longitude to 3D Cartesian coordinates
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const x = -(radius * Math.sin(phi) * Math.sin(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);

      return new THREE.Vector3(x, y, z);
    };

    // Add exchange pins
    const pinGroup = new THREE.Group();
    globe.add(pinGroup);

    const pinGeometry = new THREE.SphereGeometry(2, 8, 8);
    const pinMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF94 });

    const pinLookup: { [key: string]: THREE.Mesh } = {};

    exchanges.forEach(ex => {
      const pos = latLonToVector3(ex.lat, ex.lon, globeRadius);
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);
      pin.position.copy(pos);
      pinGroup.add(pin);
      pinLookup[ex.id] = pin;

      // Add a small neon orbit ring around the pin
      const ringGeo = new THREE.RingGeometry(3, 4, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00FF94,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      pinGroup.add(ring);
    });

    // Handle camera rotation target coordinates
    let targetRotationX = 0;
    let targetRotationY = 0;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth rotate camera towards target if selected
      if (selectedExchangeId) {
        const activeEx = exchanges.find(e => e.id === selectedExchangeId);
        if (activeEx) {
          // Convert target lat/lon to angles
          const phi = (90 - activeEx.lat) * (Math.PI / 180);
          const theta = (activeEx.lon + 180) * (Math.PI / 180);
          
          targetRotationX = phi - Math.PI / 2;
          targetRotationY = -theta - Math.PI / 2;
        }
      }

      // Interpolar damp rotation for smooth camera movement
      globe.rotation.x += (targetRotationX - globe.rotation.x) * 0.05;
      globe.rotation.y += (targetRotationY - globe.rotation.y) * 0.05;

      // Subtle pulse on pins
      const time = Date.now() * 0.003;
      const scale = 1 + Math.sin(time) * 0.15;
      pinGroup.children.forEach(child => {
        child.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      gridGeometry.dispose();
      gridMaterial.dispose();
      pinGeometry.dispose();
      pinMaterial.dispose();
    };
  }, [selectedExchangeId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* 3D WebGL Globe Canvas Box */}
      <div className="lg:col-span-2 glass-card rounded-3xl border border-border-glass relative overflow-hidden flex flex-col justify-between p-6 bg-surface-lowest/20 min-h-[350px]">
        {/* Overlay Label */}
        <div className="absolute top-6 left-6 z-10 space-y-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Globe className="w-4.5 h-4.5 text-app-green animate-pulse" /> 3D Global Liquidity Globe
          </h2>
          <span className="text-[10px] text-[#8A8F98] block">Select an exchange on the right to auto-rotate coordinate cameras.</span>
        </div>

        {/* Canvas Mount */}
        <div ref={mountRef} className="w-full h-full flex-1" />

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
