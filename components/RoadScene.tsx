"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const ROAD_W = 9;
const DASH_COUNT = 48;
const DASH_GAP = 6;
const POLE_COUNT = 14;
const POLE_GAP = 16;
const LOOP_DASH = DASH_COUNT * DASH_GAP;
const LOOP_POLE = POLE_COUNT * POLE_GAP;

const AMBER = new THREE.Color("#ffb347");
const RED = new THREE.Color("#ff3b30");
const NIGHT = new THREE.Color("#07080c");
const DAWN = new THREE.Color("#1b1030");
const ALARM_BG = new THREE.Color("#2a0608");

const wrap = (v: number, loop: number) => ((v % loop) + loop) % loop;

export default function RoadScene() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = NIGHT.clone();
    scene.fog = new THREE.Fog(NIGHT.clone(), 20, 150);

    const camera = new THREE.PerspectiveCamera(62, host.clientWidth / host.clientHeight, 0.1, 400);
    camera.position.set(0, 1.35, 0);

    // Road surface + shoulders
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_W, 400),
      new THREE.MeshBasicMaterial({ color: "#14161d" }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.z = -190;
    scene.add(road);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 400),
      new THREE.MeshBasicMaterial({ color: "#0a0b10" }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.02, -190);
    scene.add(ground);

    // Accent-coloured materials shared so alert state can recolour in one place
    const accent = new THREE.MeshBasicMaterial({ color: AMBER.clone() });
    const glow = new THREE.MeshBasicMaterial({ color: AMBER.clone(), transparent: true, opacity: 0.35 });

    // Edge lines
    for (const side of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 400), new THREE.MeshBasicMaterial({ color: "#e9e9ef" }));
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(side * (ROAD_W / 2 - 0.35), 0.01, -190);
      scene.add(edge);
    }

    // Centre dashes (instanced)
    const dashGeo = new THREE.PlaneGeometry(0.2, 2.6);
    dashGeo.rotateX(-Math.PI / 2);
    const dashes = new THREE.InstancedMesh(dashGeo, accent, DASH_COUNT);
    scene.add(dashes);

    // Roadside poles with lamp heads
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 5.2, 6);
    poleGeo.translate(0, 2.6, 0);
    const poles = new THREE.InstancedMesh(poleGeo, new THREE.MeshBasicMaterial({ color: "#262a36" }), POLE_COUNT * 2);
    const lampGeo = new THREE.SphereGeometry(0.28, 12, 8);
    const lamps = new THREE.InstancedMesh(lampGeo, accent, POLE_COUNT * 2);
    const haloGeo = new THREE.CircleGeometry(1.6, 24);
    const halos = new THREE.InstancedMesh(haloGeo, glow, POLE_COUNT * 2);
    scene.add(poles, lamps, halos);

    // Stars + moon
    const starPos = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 120 + Math.random() * 60;
      starPos[i * 3] = Math.cos(a) * r;
      starPos[i * 3 + 1] = 12 + Math.random() * 90;
      starPos[i * 3 + 2] = -Math.abs(Math.sin(a)) * r - 20;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: "#cfd6ff", size: 0.9, sizeAttenuation: false, fog: false }));
    scene.add(stars);

    const moon = new THREE.Mesh(new THREE.CircleGeometry(7, 40), new THREE.MeshBasicMaterial({ color: "#f3efe2", fog: false }));
    moon.position.set(105, 88, -190);
    scene.add(moon);

    // Distant dhaba that drifts past on the right
    const dhaba = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(7, 3, 4), new THREE.MeshBasicMaterial({ color: "#1c1a22" }));
    body.position.y = 1.5;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(8, 0.3, 5), new THREE.MeshBasicMaterial({ color: "#2b2833" }));
    roof.position.y = 3.15;
    const windows = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.2), new THREE.MeshBasicMaterial({ color: "#ffcf8a" }));
    windows.position.set(0, 1.6, 2.02);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.2), new THREE.MeshBasicMaterial({ color: "#ffb347" }));
    sign.position.set(0, 4.2, 2.2);
    const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), new THREE.MeshBasicMaterial({ color: "#262a36" }));
    signPost.position.set(0, 3.6, 2.2);
    dhaba.add(body, roof, windows, sign, signPost);
    dhaba.position.x = ROAD_W / 2 + 9;
    dhaba.rotation.y = -0.15;
    scene.add(dhaba);
    const DHABA_LOOP = 340;

    // Input + state
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let scrollY = window.scrollY;
    let scrollVel = 0;
    let lastScrollY = scrollY;
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let alert = 0; // 0 normal, 1 drowsy, 2 emergency
    const onAlert = (e: Event) => {
      alert = (e as CustomEvent<number>).detail ?? 0;
    };
    window.addEventListener("sarathi:alert", onAlert);

    const onResize = () => {
      renderer.setSize(host.clientWidth, host.clientHeight);
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const m = new THREE.Matrix4();
    const tint = new THREE.Color();
    let travelled = 0;
    let speed = reduced ? 3 : 16;
    let alertMix = 0;
    let camX = 0;
    let camY = 1.35;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    const onVis = () => {
      visible = !document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // Scroll velocity speeds the truck up; critically damped follow.
      scrollVel += ((scrollY - lastScrollY) / Math.max(dt, 1e-3) - scrollVel) * Math.min(1, dt * 6);
      lastScrollY = scrollY;
      const target = reduced ? 3 : 16 + Math.min(Math.abs(scrollVel) * 0.04, 50) + (alert === 2 ? -6 : 0);
      speed += (target - speed) * Math.min(1, dt * 3);
      travelled += speed * dt;

      // Alert blend
      alertMix += ((alert === 2 ? 1 : alert === 1 ? 0.45 : 0) - alertMix) * Math.min(1, dt * 4);
      const pulse = alert === 2 && !reduced ? 0.5 + 0.5 * Math.sin(now / 130) : 0;
      tint.copy(AMBER).lerp(RED, Math.min(1, alertMix * 1.4));
      (accent.color as THREE.Color).copy(tint);
      (glow.color as THREE.Color).copy(tint);
      glow.opacity = 0.3 + pulse * 0.25;

      // Sky darkens toward dawn as the page scrolls, flashes red on emergency
      const prog = Math.min(1, scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight));
      const bg = scene.background as THREE.Color;
      bg.copy(NIGHT).lerp(DAWN, prog * 0.7).lerp(ALARM_BG, alertMix * (0.6 + pulse * 0.4));
      (scene.fog as THREE.Fog).color.copy(bg);

      // Dashes
      for (let i = 0; i < DASH_COUNT; i++) {
        const z = -wrap(i * DASH_GAP + travelled, LOOP_DASH) + 4;
        m.makeTranslation(0, 0.012, z);
        dashes.setMatrixAt(i, m);
      }
      dashes.instanceMatrix.needsUpdate = true;

      // Poles, lamps, halos (both sides)
      for (let i = 0; i < POLE_COUNT; i++) {
        const z = -wrap(i * POLE_GAP + travelled, LOOP_POLE) + 4;
        for (let s = 0; s < 2; s++) {
          const x = (s === 0 ? -1 : 1) * (ROAD_W / 2 + 1.6);
          const idx = i * 2 + s;
          m.makeTranslation(x, 0, z);
          poles.setMatrixAt(idx, m);
          m.makeTranslation(x - Math.sign(x) * 0.4, 5.3, z);
          lamps.setMatrixAt(idx, m);
          m.makeRotationX(-Math.PI / 2).setPosition(x - Math.sign(x) * 0.4, 0.03, z);
          halos.setMatrixAt(idx, m);
        }
      }
      poles.instanceMatrix.needsUpdate = true;
      lamps.instanceMatrix.needsUpdate = true;
      halos.instanceMatrix.needsUpdate = true;

      dhaba.position.z = -wrap(120 + travelled * 0.9, DHABA_LOOP) + 10;

      // Camera: gentle parallax + sway; dips on emergency (head-nod feel)
      const px = reduced ? 0 : pointer.x * 0.9;
      const py = reduced ? 0 : -pointer.y * 0.25;
      camX += (px - camX) * Math.min(1, dt * 4);
      camY += (1.35 + py + (alert === 2 ? -0.18 * (0.5 + 0.5 * Math.sin(now / 420)) : 0) - camY) * Math.min(1, dt * 4);
      camera.position.set(camX, camY, 0);
      camera.rotation.y = -camX * 0.04;
      camera.rotation.z = reduced ? 0 : Math.sin(now / 1800) * 0.004;
      stars.rotation.y = prog * 0.15;

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("sarathi:alert", onAlert);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mount} className="scene" aria-hidden="true" />;
}
