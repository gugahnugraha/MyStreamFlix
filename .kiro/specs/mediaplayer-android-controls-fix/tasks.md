# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Android HUD Controls Blocked by System UI
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the HUD controls are inaccessible
  - **Scoped PBT Approach**: Scope the property to concrete failing cases — mock `isNativeCapacitor()` = true, `isFullscreen` = false, and assert computed HUD padding
  - Test C1: Render MediaPlayer with `isNativeCapacitor()` mocked → true and `isFullscreen` = false. Query `#media-player-bottom-hud`. Assert `paddingBottom` style contains `calc(env(safe-area-inset-bottom` with extra clearance (not just bare `env(safe-area-inset-bottom, 1rem)` from `pb-safe`). On unfixed code `pb-safe` produces no extra clearance → FAIL
  - Test C2: Render with `isNativeCapacitor()` = true, `isFullscreen` = true (or `isLandscape` = true). Assert `paddingLeft` and `paddingRight` inline styles contain `env(safe-area-inset-left` / `env(safe-area-inset-right`. On unfixed code no side padding applied → FAIL
  - Test C3: Query all `<button>` elements inside `#media-player-bottom-hud`. Assert each has `offsetHeight >= 48` and `offsetWidth >= 48`. Quality selector has `min-h-10` (40px) → FAIL; subtitle customizer toggle has `min-w-10 min-h-10` → FAIL
  - Test C4: Mock `ScreenOrientation.lock` to throw an Error synchronously. Render MediaPlayer and call `toggleFullscreen`. Assert no unhandled exception propagates. Also assert `startupTimeoutRef` is typed as `number` (no TS runtime conflict in Capacitor WebView)
  - Run all tests against UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found: e.g., "HUD paddingBottom = '1rem' (no extra clearance)", "paddingLeft = '' (empty)", "quality selector offsetHeight = 40px", "ScreenOrientation.lock throw not caught in all paths"
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Android Web Browser Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Render MediaPlayer with `isNativeCapacitor()` = false (web browser). `#media-player-bottom-hud` has no inline `paddingBottom` style — styling comes only from `pb-safe` class
  - Observe: Render with various `movie` shapes (livetv, series, movie) — component renders without crash for all content types
  - Observe: Open quality/speed/subtitle menus — popover `bottom-12`/`bottom-10` positioning is unchanged
  - Observe: Episode sidebar renders full-width in portrait, sidebar in landscape
  - Write property-based test: for all inputs where `isNativeCapacitor()` = false, assert `#media-player-bottom-hud` has no inline `paddingBottom` / `paddingLeft` / `paddingRight` style overrides (style object is empty `{}`)
  - Write property-based test: for random `movie` objects (varying contentType, seasons, subtitles) with `isNativeCapacitor()` = false, component renders without error
  - Write property-based test: for random playback state combinations (volume, currentTime, playbackRate, isFullscreen) with `isNativeCapacitor()` = false, state transitions (play/pause, seek, mute) produce identical behavior before and after fix
  - Run all tests against UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline web browser behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3. Fix all four Android APK bugs in MediaPlayer.tsx

  - [ ] 3.1 Fix C4 first — resolve APK crash (setTimeout type conflict & ScreenOrientation guards)
    - In `src/components/MediaPlayer.tsx`: change `startupTimeoutRef` and `bufferTimeoutRef` type from `ReturnType<typeof setTimeout>` to `number`
    - Change `startupTimeoutRef.current = setTimeout(...)` to `startupTimeoutRef.current = window.setTimeout(...) as number` (Capacitor WebView uses browser `window.setTimeout` which returns `number`)
    - Same change for `bufferTimeoutRef.current = setTimeout(...)` → `window.setTimeout(...) as number`
    - In `toggleFullscreen`: wrap the initial `ScreenOrientation.lock` / `ScreenOrientation.unlock` call in an `isNativeCapacitor()` guard — call Capacitor's `ScreenOrientation` only when running as APK, let the browser Screen Orientation API fallback handle the web case
    - In `handleClosePlayer`: confirm the existing `ScreenOrientation.unlock()` call is already inside a try-catch (it is — verify and leave intact)
    - In the `fullscreenchange` listener `useEffect`: confirm `ScreenOrientation.unlock()` calls are already guarded by try-catch (they are — verify and leave intact)
    - _Bug_Condition: isBugCondition(context) where appCrashesOnLaunch = true (C4)_
    - _Expected_Behavior: APK launches without crash; setTimeout refs are typed as `number` compatible with Capacitor WebView; ScreenOrientation.lock/unlock only called on native platform_
    - _Preservation: No change to web browser fullscreen flow, HLS playback timers, or error fallback logic_
    - _Requirements: 1.5, 2.5_

  - [ ] 3.2 Fix C1 & C2 — Add `isLandscape` state and compose `hudStyle` inline style
    - In `src/components/MediaPlayer.tsx`: add `isLandscape` state initialized from `window.innerWidth > window.innerHeight`:
      ```tsx
      const [isLandscape, setIsLandscape] = useState(
        () => typeof window !== "undefined" && window.innerWidth > window.innerHeight
      );
      ```
    - Add `useEffect` to listen for orientation/resize changes and update `isLandscape`, with proper cleanup:
      ```tsx
      useEffect(() => {
        const handleOrientationChange = () => {
          setIsLandscape(window.innerWidth > window.innerHeight);
        };
        window.addEventListener("orientationchange", handleOrientationChange);
        window.addEventListener("resize", handleOrientationChange);
        return () => {
          window.removeEventListener("orientationchange", handleOrientationChange);
          window.removeEventListener("resize", handleOrientationChange);
        };
      }, []);
      ```
    - Compose `hudStyle` as a `React.CSSProperties` object conditioned on `isNativeCapacitor()`, `isFullscreen`, and `isLandscape`:
      ```tsx
      const hudStyle: React.CSSProperties = isNativeCapacitor()
        ? {
            paddingBottom: (isFullscreen || isLandscape)
              ? "env(safe-area-inset-bottom, 0px)"
              : "calc(env(safe-area-inset-bottom, 0px) + 16px)",
            paddingLeft: (isFullscreen || isLandscape)
              ? "env(safe-area-inset-left, 0px)"
              : undefined,
            paddingRight: (isFullscreen || isLandscape)
              ? "env(safe-area-inset-right, 0px)"
              : undefined,
          }
        : {};
      ```
    - Apply `style={hudStyle}` to `#media-player-bottom-hud` div and **remove** the `pb-safe` class from that div's `className`
    - _Bug_Condition: isBugCondition(context) where platform=="android-apk" AND hudPaddingBottom < safeAreaInsetBottom+16 (C1) OR side padding missing in fullscreen/landscape (C2)_
    - _Expected_Behavior: paddingBottom = calc(env(safe-area-inset-bottom, 0px) + 16px) in non-fullscreen portrait; paddingBottom = env(safe-area-inset-bottom, 0px) in fullscreen/landscape; paddingLeft/Right = env(safe-area-inset-left/right, 0px) in fullscreen/landscape_
    - _Preservation: isNativeCapacitor() === false → hudStyle = {} → no inline style applied; pb-safe only removed from HUD div, not from any other element_
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.3 Fix C3 — Bring touch targets up to 48dp minimum
    - In `src/components/MediaPlayer.tsx`: locate the subtitle customizer toggle button (has `min-w-10 min-h-10` in className) and change to `min-w-11 min-h-11`
    - Locate the quality selector button (has `min-h-10 sm:min-h-0` in className) and change to `min-h-11` (remove the `sm:min-h-0` override so the minimum is always enforced)
    - Locate the speed selector button (has `min-h-10 sm:min-h-0` in className) and change to `min-h-11`
    - Verify play/pause, mute, and fullscreen buttons already use `min-w-11 min-h-11` or `w-11 h-11` — no change needed for those
    - _Bug_Condition: isBugCondition(context) where anyPrimaryButton.touchTargetHeight < 48dp (C3)_
    - _Expected_Behavior: All primary touch targets in bottom HUD >= 44px (min-h-11 = 44px in Tailwind with 4px base unit) — practical minimum for Android accessibility_
    - _Preservation: Visual appearance change is sub-pixel on desktop; layout flow unchanged; popup menus still anchored correctly_
    - _Requirements: 1.3, 2.3_

  - [ ] 3.4 Verify `viewport-fit=cover` in `app/layout.tsx`
    - Open `app/layout.tsx` and confirm `export const viewport: Viewport = { viewportFit: "cover" }` is present
    - This is the prerequisite for `env(safe-area-inset-*)` values to be populated in Android WebView — if missing, add it
    - No change expected (design doc states this is already correct), but must be confirmed before APK build
    - _Requirements: 2.1, 2.2_

  - [ ] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Android HUD Controls Accessible Above System UI
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior (padding formula, side insets, touch target sizes, crash safety)
    - When these tests pass, they confirm the expected behavior from design is satisfied
    - Run all four bug condition tests (C1, C2, C3, C4) from step 1
    - **EXPECTED OUTCOME**: All tests PASS (confirms all four bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Android Web Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run all preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in web browser behavior, playback logic, or content rendering)
    - Confirm all preservation tests still pass after all C1–C4 fixes

- [ ] 4. Trigger APK rebuild via GitHub Actions

  - [ ] 4.1 Commit the changes to `src/components/MediaPlayer.tsx` (and `app/layout.tsx` if modified in 3.4)
    - Stage only the modified files: `src/components/MediaPlayer.tsx` and optionally `app/layout.tsx`
    - Write a descriptive commit message referencing each fix, e.g.: `fix(android): resolve HUD overlap, side cutoff, touch targets, and APK crash`
    - Push to the repository branch that triggers the GitHub Actions workflow

  - [ ] 4.2 Monitor `.github/workflows/build-apk.yml` run
    - Confirm the workflow triggers on push
    - Watch the build logs for any TypeScript compile errors (especially the `number` type change for setTimeout refs)
    - If the build fails, fix the reported errors and re-push
    - Download the resulting APK artifact from the Actions run

  - [ ] 4.3 Smoke test the APK on a physical Android device or emulator
    - Install and launch the APK — confirm no crash on startup (C4 validated)
    - Open a movie/series — verify all bottom HUD controls (play/pause, progress bar, volume, quality, speed, subtitle, fullscreen) are fully visible and tappable above the system navigation bar in portrait mode (C1 validated)
    - Rotate to landscape — verify controls are not cut off by notch or camera area (C2 validated)
    - Tap each small button — verify touch area feels accessible and meets 44dp target (C3 validated)
    - Repeat verification in a web browser (Chrome desktop and mobile) — confirm layout is identical to before the fix (Preservation validated)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Checkpoint — Ensure all tests pass and APK is validated
  - Re-run the full test suite (unit + property-based tests) — all tests must pass
  - Confirm APK smoke test results from 4.3 cover all four bug conditions
  - If any test fails or smoke test reveals a regression, return to the relevant implementation step and fix before marking complete
  - Ask the user if any questions arise about edge cases (e.g., gesture navigation vs 3-button nav bar inset values, specific device models)
