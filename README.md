
# AEROFOLD™ 3D Experience

A high-performance cinematic product landing page for a foldable drone company.

## Setup
1. Ensure you have a local web server (like Live Server in VSCode).
2. For production assets, replace the `createMockDrone` function with a `GLTFLoader` call to a high-quality `drone.glb`.
3. The GLB should have separate nodes for `Arms`, `Propellers`, `Camera`, and `LandingGear` to target them in GSAP.

## Deployment on Vercel
1. Push your code to a GitHub repository.
2. Connect the repository to Vercel.
3. Ensure `index.html`, `App.js`, and any assets are in the root directory.
4. Deploy!

## Technical Notes
- **Performance**: Antialiasing is enabled, but pixel ratio is capped at 2 for mobile performance.
- **Visuals**: Emissive materials simulate "Electric Blue" accent glow without heavy post-processing.
- **Interactivity**: ScrollTrigger is used for precise 1:1 mapping of scroll depth to drone unfolding state.
