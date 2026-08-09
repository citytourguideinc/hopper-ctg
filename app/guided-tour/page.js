"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";

const STOPS = [
  {
    id: "roundabout",
    number: 1,
    name: "Harbour Island: Roundabout",
    lat: 27.93731080403813,
    lng: -82.4524776989486,
    radius: 10,
    audio: "/api/hopper/guided-tour-audio/roundabout",
    thumbnail: "/guided-tour/roundabout.jpg",
    placeLabel: "Harbour Island Roundabout"
  },
  {
    id: "the-pointe",
    number: 2,
    name: "Harbour Island: The Pointe",
    lat: 27.9378518535792,
    lng: -82.451272244653,
    radius: 10,
    audio: "/api/hopper/guided-tour-audio/the-pointe",
    thumbnail: "/guided-tour/the-pointe.jpg",
    placeLabel: "Harbour Island The Pointe"
  },
  {
    id: "convention-center",
    number: 3,
    name: "Downtown Tampa: Convention Center",
    lat: 27.9398811094936,
    lng: -82.454491475554,
    radius: 15,
    direction: 67,
    audio: "/api/hopper/guided-tour-audio/convention-center",
    thumbnail: "/guided-tour/convention-center.jpg",
    placeLabel: "Tampa Convention Center"
  },
  {
    id: "marriott-hotels",
    number: 4,
    name: "Water Street: Marriott Hotels",
    lat: 27.942762271972157,
    lng: -82.45478340445807,
    radius: 15,
    audio: "/api/hopper/guided-tour-audio/marriott-hotels",
    thumbnail: "/guided-tour/marriott-hotels.jpg",
    placeLabel: "Water Street Marriott Hotels"
  },
  {
    id: "fort-brooke-park",
    number: 5,
    name: "Water Street: Fort Brooke Park",
    lat: 27.941361357586686,
    lng: -82.45387138473703,
    radius: 15,
    audio: "/api/hopper/guided-tour-audio/fort-brooke-park",
    thumbnail: "/guided-tour/fort-brooke-park.png",
    placeLabel: "Cotanchobee Fort Brooke Park"
  },
  {
    id: "history-center",
    number: 6,
    name: "Tampa Bay History Center",
    lat: 27.9433346754967,
    lng: -82.452599288991,
    radius: 16,
    audio: "/api/hopper/guided-tour-audio/history-center",
    thumbnail: "/guided-tour/history-center.jpg",
    placeLabel: "Tampa Bay History Center"
  },
  {
    id: "amalie-arena",
    number: 7,
    name: "Water Street: Amalie Arena",
    lat: 27.943306581165345,
    lng: -82.4530907939246,
    radius: 15,
    audio: "/api/hopper/guided-tour-audio/amalie-arena",
    thumbnail: "/guided-tour/amalie-arena.jpg",
    placeLabel: "Amalie Arena"
  },
  {
    id: "water-street-phase-1",
    number: 8,
    name: "Water Street: Phase 1",
    lat: 27.9435444791480,
    lng: -82.451260453741,
    radius: 15,
    audio: "/api/hopper/guided-tour-audio/water-street-phase-1",
    thumbnail: "/guided-tour/water-street-phase-1.jpg",
    placeLabel: "Water Street Phase 1"
  },
  {
    id: "sparkman-wharf",
    number: 9,
    name: "Channelside: Sparkman Wharf",
    lat: 27.9435465496822,
    lng: -82.448629272632,
    radius: 15,
    audio: "/api/hopper/guided-tour-audio/sparkman-wharf",
    thumbnail: "/guided-tour/sparkman-wharf.jpg",
    placeLabel: "Sparkman Wharf"
  }
];

const SILENT_AUDIO =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAACAgICA";

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = value => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function mercatorPoint(lat, lng, zoom) {
  const size = 256 * Math.pow(2, zoom);
  const safeLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sin = Math.sin((safeLat * Math.PI) / 180);

  return {
    x: ((lng + 180) / 360) * size,
    y:
      (0.5 -
        Math.log((1 + sin) / (1 - sin)) /
          (4 * Math.PI)) *
      size
  };
}

function chooseZoom(userLocation, stop) {
  if (!userLocation) return 16;

  const d = distanceMeters(
    userLocation.lat,
    userLocation.lng,
    stop.lat,
    stop.lng
  );

  if (d > 6000) return 12;
  if (d > 3000) return 13;
  if (d > 1500) return 14;
  if (d > 700) return 15;
  if (d > 300) return 16;

  return 17;
}

function TourMap({ userLocation, stop }) {
  const frameRef = useRef(null);
  const [size, setSize] = useState({
    width: 480,
    height: 270
  });

  useEffect(() => {
    if (!frameRef.current) return;

    const updateSize = () => {
      if (!frameRef.current) return;

      setSize({
        width: frameRef.current.clientWidth || 480,
        height: frameRef.current.clientHeight || 270
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(frameRef.current);

    return () => observer.disconnect();
  }, []);

  const zoom = chooseZoom(userLocation, stop);

  const centerLat = userLocation
    ? (userLocation.lat + stop.lat) / 2
    : stop.lat;

  const centerLng = userLocation
    ? (userLocation.lng + stop.lng) / 2
    : stop.lng;

  const center = mercatorPoint(
    centerLat,
    centerLng,
    zoom
  );

  const stopPoint = mercatorPoint(
    stop.lat,
    stop.lng,
    zoom
  );

  const userPoint = userLocation
    ? mercatorPoint(
        userLocation.lat,
        userLocation.lng,
        zoom
      )
    : null;

  const markerPosition = point => ({
    left:
      size.width / 2 +
      point.x -
      center.x,
    top:
      size.height / 2 +
      point.y -
      center.y
  });

  const stopPos = markerPosition(stopPoint);
  const userPos = userPoint
    ? markerPosition(userPoint)
    : null;

  const centerTileX = Math.floor(center.x / 256);
  const centerTileY = Math.floor(center.y / 256);
  const tileCount = Math.pow(2, zoom);
  const tiles = [];

  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const rawX = centerTileX + dx;
      const rawY = centerTileY + dy;

      if (rawY < 0 || rawY >= tileCount) continue;

      const tileX =
        ((rawX % tileCount) + tileCount) %
        tileCount;

      const left =
        size.width / 2 +
        rawX * 256 -
        center.x;

      const top =
        size.height / 2 +
        rawY * 256 -
        center.y;

      tiles.push({
        key: `${rawX}-${rawY}`,
        src:
          `https://tile.openstreetmap.org/` +
          `${zoom}/${tileX}/${rawY}.png`,
        left,
        top
      });
    }
  }

  return (
    <div
      ref={frameRef}
      style={styles.mapFrame}
    >
      {tiles.map(tile => (
        <img
          key={tile.key}
          src={tile.src}
          alt=""
          draggable="false"
          style={{
            ...styles.mapTile,
            left: tile.left,
            top: tile.top
          }}
        />
      ))}

      {userPos && (
        <svg
          width={size.width}
          height={size.height}
          style={styles.routeOverlay}
          aria-hidden="true"
        >
          <line
            x1={userPos.left}
            y1={userPos.top}
            x2={stopPos.left}
            y2={stopPos.top}
            stroke="#0057E7"
            strokeWidth="4"
            strokeDasharray="8 7"
            opacity="0.75"
          />
        </svg>
      )}

      {userPos && (
        <div
          style={{
            ...styles.userMarker,
            left: userPos.left,
            top: userPos.top
          }}
        >
          <span style={styles.markerDotBlue} />
          <span style={styles.markerLabel}>
            You
          </span>
        </div>
      )}

      <div
        style={{
          ...styles.stopMarker,
          left: stopPos.left,
          top: stopPos.top
        }}
      >
        <span style={styles.markerDotRed} />
        <span style={styles.markerLabel}>
          {stop.number}
        </span>
      </div>

      <div style={styles.mapAttribution}>
        © OpenStreetMap contributors
      </div>
    </div>
  );
}

function Thumbnail({ stop }) {
  const [failed, setFailed] =
    useState(false);

  if (failed) {
    return (
      <div style={styles.thumbFallback}>
        <div style={styles.thumbFallbackTitle}>
          {stop.placeLabel}
        </div>

        <div style={styles.thumbFallbackCoords}>
          {stop.lat.toFixed(6)},{" "}
          {stop.lng.toFixed(6)}
        </div>
      </div>
    );
  }

  return (
    <img
      src={stop.thumbnail}
      alt={stop.placeLabel}
      style={styles.thumb}
      onError={() => setFailed(true)}
    />
  );
}

export default function GuidedTourPage() {
  const audioRef = useRef(null);
  const triggeredRef = useRef(new Set());
  const queuedRef = useRef(null);

  const carouselRef = useRef(null);
  const cardRefs = useRef([]);
  const carouselTimerRef = useRef(null);
  const phoneWatchRef = useRef(null);

  const [checking, setChecking] =
    useState(true);

  const [authed, setAuthed] =
    useState(false);

  const [code, setCode] =
    useState("");

  const [error, setError] =
    useState("");

  const [started, setStarted] =
    useState(false);

  const [vehicleLocation, setVehicleLocation] =
    useState(null);

  const [phoneLocation, setPhoneLocation] =
    useState(null);

  const [phoneLocationError, setPhoneLocationError] =
    useState("");

  const [triggerDistances, setTriggerDistances] =
    useState({});

  const [playing, setPlaying] =
    useState(null);

  const [pausedStop, setPausedStop] =
    useState(null);

  const [queued, setQueued] =
    useState(null);

  const [triggered, setTriggered] =
    useState([]);

  const [lastPoll, setLastPoll] =
    useState(null);

  const [selectedStopId, setSelectedStopId] =
    useState(STOPS[0].id);

  const selectedIndex = STOPS.findIndex(
    stop => stop.id === selectedStopId
  );

  const selectedStop =
    STOPS[selectedIndex] || STOPS[0];

  useEffect(() => {
    fetch(
      "/api/hopper/guided-tour-login",
      { cache: "no-store" }
    )
      .then(r => r.json())
      .then(d => {
      const ok = !!d.ok;
      setAuthed(ok);

      if (ok) {
        setStarted(true);
        beginPhoneGPS();
      }
    })
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    return () => {
      if (
        phoneWatchRef.current !== null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(
          phoneWatchRef.current
        );
      }
    };
  }, []);

  function beginPhoneGPS() {
    setPhoneLocationError("");

    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      setPhoneLocationError(
        "Phone GPS is not available in this browser."
      );
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost"
    ) {
      setPhoneLocationError(
        "Phone GPS requires a secure HTTPS connection."
      );
      return;
    }

    if (phoneWatchRef.current !== null) {
      navigator.geolocation.clearWatch(
        phoneWatchRef.current
      );
    }

    phoneWatchRef.current =
      navigator.geolocation.watchPosition(
        position => {
          setPhoneLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          });

          setPhoneLocationError("");
        },

        geoError => {
          if (geoError.code === 1) {
            setPhoneLocationError(
              "Location permission was not granted."
            );
          }
          else if (geoError.code === 2) {
            setPhoneLocationError(
              "Phone location is temporarily unavailable."
            );
          }
          else {
            setPhoneLocationError(
              "Phone GPS timed out. Try again."
            );
          }
        },

        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 12000
        }
      );
  }

  const playStop = useCallback(
    async (stop, manual = false) => {
      const player = audioRef.current;

      if (!player) return;

      try {
        if (manual) {
          queuedRef.current = null;
          setQueued(null);

          player.pause();
          player.currentTime = 0;
        }

        player.src = stop.audio;
        player.load();

        await player.play();

        setPlaying(stop.id);
        setPausedStop(null);
        setError("");
      }
      catch {
        setError(
          "Audio was blocked. Tap Play again."
        );
      }
    },
    []
  );

  async function toggleStopAudio(stop) {
    const player = audioRef.current;

    if (!player) return;

    try {
      if (
        playing === stop.id &&
        !player.paused &&
        !player.ended
      ) {
        player.pause();
        setPausedStop(stop.id);
        setError("");
        return;
      }

      if (
        playing === stop.id &&
        pausedStop === stop.id &&
        player.paused &&
        !player.ended
      ) {
        await player.play();
        setPausedStop(null);
        setError("");
        return;
      }

      setPausedStop(null);
      await playStop(stop, true);
    }
    catch {
      setError(
        "Audio was blocked. Tap Play again."
      );
    }
  }

  function stopStopAudio() {
    const player = audioRef.current;

    if (!player) return;

    player.pause();
    player.currentTime = 0;

    queuedRef.current = null;
    setQueued(null);
    setPlaying(null);
    setPausedStop(null);
    setError("");
  }

  const automaticTrigger = useCallback(
    async stop => {
      const player = audioRef.current;

      if (
        player &&
        !player.paused &&
        !player.ended
      ) {
        queuedRef.current = stop;
        setQueued(stop.id);
        return;
      }

      await playStop(stop, false);
    },
    [playStop]
  );

  useEffect(() => {
    if (!started) return;

    let cancelled = false;

    async function pollVehicleLocation() {
      try {
        const response = await fetch(
          "/api/hopper/guided-tour-location",
          { cache: "no-store" }
        );

        const data = await response.json();

        if (
          cancelled ||
          !response.ok ||
          !data.available
        ) {
          return;
        }

        setVehicleLocation({
          lat: data.lat,
          lng: data.lng,
          updated_at: data.updated_at
        });

        setLastPoll(new Date());

        const nextDistances = {};

        for (const stop of STOPS) {
          const distance = distanceMeters(
            data.lat,
            data.lng,
            stop.lat,
            stop.lng
          );

          nextDistances[stop.id] =
            distance;

          if (
            distance <= stop.radius &&
            !triggeredRef.current.has(stop.id)
          ) {
            triggeredRef.current.add(
              stop.id
            );

            setTriggered(
              Array.from(
                triggeredRef.current
              )
            );

            automaticTrigger(stop);
          }
        }

        setTriggerDistances(
          nextDistances
        );
      }
      catch {
        if (!cancelled) {
          setError(
            "Unable to read vehicle location."
          );
        }
      }
    }

    pollVehicleLocation();

    const timer = setInterval(
      pollVehicleLocation,
      5000
    );

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [started, automaticTrigger]);

  async function login(event) {
    event.preventDefault();
    setError("");

    const player = audioRef.current;

    if (player) {
      try {
        player.src = SILENT_AUDIO;
        await player.play();
        player.pause();
        player.currentTime = 0;
      }
      catch {
        // Manual Play remains available if browser blocks audio priming.
      }
    }

    try {
      const response = await fetch(
        "/api/hopper/guided-tour-login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({ code })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
          "Access denied"
        );
        return;
      }

      setStarted(true);
    setAuthed(true);
    setCode("");
    beginPhoneGPS();
    }
    catch {
      setError(
        "Unable to verify access code."
      );
    }
  }

  async function startTour() {
    const player = audioRef.current;

    if (!player) return;

    try {
      player.src = SILENT_AUDIO;

      await player.play();

      player.pause();
      player.currentTime = 0;

      setStarted(true);
      setError("");

      beginPhoneGPS();
    }
    catch {
      setError(
        "Audio permission was blocked. Check browser audio settings."
      );
    }
  }

  function resetTest() {
    triggeredRef.current =
      new Set();

    queuedRef.current = null;

    setTriggered([]);
    setQueued(null);
    setPlaying(null);
    setPausedStop(null);
    setTriggerDistances({});

    const player =
      audioRef.current;

    if (player) {
      player.pause();
      player.currentTime = 0;
    }
  }

  async function exitTour() {
    resetTest();

    setStarted(false);

    if (
      phoneWatchRef.current !== null &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(
        phoneWatchRef.current
      );

      phoneWatchRef.current = null;
    }

    setPhoneLocation(null);

    await fetch(
      "/api/hopper/guided-tour-login",
      { method: "DELETE" }
    );

    setAuthed(false);
  }

  async function audioEnded() {
    setPlaying(null);
    setPausedStop(null);

    const next =
      queuedRef.current;

    if (next) {
      queuedRef.current = null;
      setQueued(null);

      await playStop(
        next,
        false
      );
    }
  }

  function selectStop(index) {
    if (
      index < 0 ||
      index >= STOPS.length
    ) {
      return;
    }

    setSelectedStopId(
      STOPS[index].id
    );

    const container =
      carouselRef.current;

    const card =
      cardRefs.current[index];

    if (
      container &&
      card
    ) {
      const target =
        card.offsetLeft -
        (container.clientWidth -
          card.clientWidth) /
          2;

      container.scrollTo({
        left: target,
        behavior: "smooth"
      });
    }
  }

  function handleCarouselScroll() {
    if (
      carouselTimerRef.current
    ) {
      clearTimeout(
        carouselTimerRef.current
      );
    }

    carouselTimerRef.current =
      setTimeout(() => {
        const container =
          carouselRef.current;

        if (!container) return;

        const containerRect =
          container.getBoundingClientRect();

        const center =
          containerRect.left +
          containerRect.width / 2;

        let closestIndex = 0;
        let closestDistance =
          Infinity;

        cardRefs.current.forEach(
          (card, index) => {
            if (!card) return;

            const rect =
              card.getBoundingClientRect();

            const cardCenter =
              rect.left +
              rect.width / 2;

            const distance =
              Math.abs(
                cardCenter -
                center
              );

            if (
              distance <
              closestDistance
            ) {
              closestDistance =
                distance;

              closestIndex =
                index;
            }
          }
        );

        setSelectedStopId(
          STOPS[closestIndex].id
        );
      }, 90);
  }

  function navigationUrl(stop) {
    const destination =
      `${stop.lat},${stop.lng}`;

    if (phoneLocation) {
      const origin =
        `${phoneLocation.lat},${phoneLocation.lng}`;

      return (
        "https://www.google.com/maps/dir/?api=1" +
        `&origin=${encodeURIComponent(origin)}` +
        `&destination=${encodeURIComponent(destination)}` +
        "&travelmode=driving"
      );
    }

    return (
      "https://www.google.com/maps/dir/?api=1" +
      `&destination=${encodeURIComponent(destination)}` +
      "&travelmode=driving"
    );
  }

  const selectedDistance =
    phoneLocation
      ? distanceMeters(
          phoneLocation.lat,
          phoneLocation.lng,
          selectedStop.lat,
          selectedStop.lng
        )
      : null;

  if (checking) {
    return (
      <main style={styles.page}>
        <div style={styles.shell}>
          Checking access...
        </div>
      </main>
    );
  }

  if (!authed) {
    return (
      <main style={styles.page}>
        <audio
          ref={audioRef}
          preload="auto"
          onEnded={audioEnded}
        />
        <div style={styles.shell}>
          <img
            src="/logo.png"
            alt="City Tour Guide, Inc."
            style={styles.logo}
          />

          <h1 style={styles.mainTitle}>
            Guided Tour
          </h1>

          <form onSubmit={login}>
            <input
              type="password"
              value={code}
              onChange={
                e =>
                  setCode(
                    e.target.value
                  )
              }
              placeholder="Access code"
              style={styles.input}
            />

            <button
              style={styles.primary}
            >
              Enter Guided Tour
            </button>
          </form>

          {error && (
            <p style={styles.error}>
              {error}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <audio
        ref={audioRef}
        preload="auto"
        onEnded={audioEnded}
      />

      <div style={styles.shell}>
    <div style={styles.tourHeader}>
      <div style={styles.tourBrand}>
        <img
          src="/logo.png"
          alt="City Tour Guide, Inc."
          style={styles.tourLogo}
        />

        <div style={styles.tourTitle}>
          Guided Tour
        </div>
      </div>

      {started && (
        <div style={styles.gpsPill}>
          <span style={styles.gpsDot} />
          GPS Active
        </div>
      )}
    </div>

    {!started ? (
          <button
            onClick={startTour}
            style={styles.primary}
          >
            Start Guided Tour
          </button>
        ) : (
          <>
        <div style={styles.mapHeadingRow}>
              <div>
                <div style={styles.mapEyebrow}>
                  SELECTED DESTINATION
                </div>

                <div style={styles.mapStopName}>
                  {selectedStop.name}
                </div>
              </div>

              <div style={styles.stopCounter}>
                {selectedIndex + 1}
                {" / "}
                {STOPS.length}
              </div>
            </div>

            <TourMap
              userLocation={phoneLocation}
              stop={selectedStop}
            />

            <div style={styles.mapInfo}>
              {phoneLocation ? (
                <>
                  <div>
                    Your GPS:{" "}
                    {phoneLocation.lat.toFixed(6)},{" "}
                    {phoneLocation.lng.toFixed(6)}
                  </div>

                  <div>
                    Accuracy: ±
                    {Math.round(
                      phoneLocation.accuracy
                    )}{" "}
                    meters
                  </div>

                  <div style={styles.distanceStrong}>
                    {selectedDistance < 1000
                      ? `${selectedDistance.toFixed(0)} meters to destination`
                      : `${(selectedDistance / 1609.344).toFixed(2)} miles to destination`}
                  </div>
                </>
              ) : (
                <div>
                  Waiting for phone GPS permission...
                </div>
              )}

              {phoneLocationError && (
                <div style={styles.locationWarning}>
                  {phoneLocationError}
                </div>
              )}
            </div>

            <a
              href={navigationUrl(selectedStop)}
              target="_blank"
              rel="noreferrer"
              style={styles.guideButton}
            >
              Guide Me Here
            </a>

            <div style={styles.carouselHeading}>
              Swipe Tour Stops
            </div>

            <div style={styles.carouselControls}>
              <button
                type="button"
                onClick={() =>
                  selectStop(
                    selectedIndex - 1
                  )
                }
                disabled={
                  selectedIndex <= 0
                }
                style={{
                  ...styles.arrowButton,
                  opacity:
                    selectedIndex <= 0
                      ? 0.35
                      : 1
                }}
              >
                ‹
              </button>

              <div style={styles.centerInstruction}>
                Center a stop to update the map
              </div>

              <button
                type="button"
                onClick={() =>
                  selectStop(
                    selectedIndex + 1
                  )
                }
                disabled={
                  selectedIndex >=
                  STOPS.length - 1
                }
                style={{
                  ...styles.arrowButton,
                  opacity:
                    selectedIndex >=
                    STOPS.length - 1
                      ? 0.35
                      : 1
                }}
              >
                ›
              </button>
            </div>

            <div
              ref={carouselRef}
              onScroll={
                handleCarouselScroll
              }
              style={styles.carousel}
            >
              {STOPS.map(
                (stop, index) => {
                  const active =
                    stop.id ===
                    selectedStopId;

                  const phoneDistance =
                    phoneLocation
                      ? distanceMeters(
                          phoneLocation.lat,
                          phoneLocation.lng,
                          stop.lat,
                          stop.lng
                        )
                      : null;

                  const vehicleDistance =
                    triggerDistances[
                      stop.id
                    ];

                  return (
                    <div
                      key={stop.id}
                      ref={element => {
                        cardRefs.current[
                          index
                        ] = element;
                      }}
                      style={{
                        ...styles.stopCard,
                        border: active
                          ? "3px solid #0057E7"
                          : "1px solid #D1D5DB"
                      }}
                    >
                      <Thumbnail
                        stop={stop}
                      />

                      <div
                        style={
                          styles.stopBody
                        }
                      >
                        <div style={styles.stopNumber}>
                          STOP {stop.number}
                        </div>

                        <div style={styles.stopTitle}>
                          {stop.name}
                        </div>

                        <div style={styles.coordinates}>
                          {stop.lat.toFixed(6)},{" "}
                          {stop.lng.toFixed(6)}
                        </div>

                        {phoneDistance !== null && (
                          <div style={styles.detail}>
                            From your phone:{" "}
                            {phoneDistance < 1000
                              ? `${phoneDistance.toFixed(0)} m`
                              : `${(phoneDistance / 1609.344).toFixed(2)} mi`}
                          </div>
                        )}

                        {Number.isFinite(
                          vehicleDistance
                        ) && (
                          <div style={styles.technical}>
                            Auto trigger GPS:{" "}
                            {vehicleDistance.toFixed(0)} m
                          </div>
                        )}

                        {playing === stop.id &&
                          pausedStop !== stop.id && (
                          <div style={styles.playing}>
                            Playing now
                          </div>
                        )}

                        {pausedStop === stop.id && (
                          <div style={styles.playing}>
                            Paused
                          </div>
                        )}

                        {queued ===
                          stop.id && (
                          <div style={styles.queued}>
                            Queued
                          </div>
                        )}

                        <div style={styles.buttonRow}>
                          <button
                            onClick={() =>
                              toggleStopAudio(stop)
                            }
                            style={styles.playButton}
                          >
                            {playing === stop.id
                              ? pausedStop === stop.id
                                ? "Resume Audio"
                                : "Pause Audio"
                              : "Play Audio"}
                          </button>

                          {playing === stop.id && (
                            <button
                              onClick={stopStopAudio}
                              style={styles.stopButton}
                            >
                              Stop
                            </button>
                          )}

                          <a
                            href={navigationUrl(stop)}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.mapButton}
                          >
                            Guide Me Here
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {phoneLocationError && (
              <button
                onClick={beginPhoneGPS}
                style={styles.secondary}
              >
                Refresh Location
              </button>
            )}

            {vehicleLocation && lastPoll && (
              <div style={styles.small}>
                Automatic narration GPS checked:{" "}
                {lastPoll.toLocaleTimeString()}
              </div>
            )}
          </>
        )}

        {error && (
          <p style={styles.error}>
            {error}
          </p>
        )}

        <button
          onClick={exitTour}
          style={styles.exit}
        >
          Exit Tour
        </button>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0B1D3A",
    padding: 14,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    fontFamily: "Arial, sans-serif"
  },

  shell: {
    width: "100%",
    maxWidth: 620,
    background: "#fff",
    borderRadius: 18,
    padding: 18,
    marginTop: 8,
    overflow: "hidden"
  },

  logo: {
    width: 88,
    display: "block",
    margin: "0 auto 10px"
  },

  tourHeader: {
    margin: "-18px -18px 14px",
    padding: "10px 12px",
    minHeight: 52,
    background: "#050505",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottom: "1px solid rgba(255,255,255,0.10)"
  },

  tourBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0
  },

  tourLogo: {
    width: 48,
    height: 48,
    objectFit: "contain",
    display: "block",
    flexShrink: 0,
    filter: "grayscale(1) invert(1) contrast(1.15)"
  },

  tourTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    whiteSpace: "nowrap"
  },

  gpsPill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    padding: "6px 9px",
    borderRadius: 999,
    background: "#0B3027",
    color: "#A7F3D0",
    border: "1px solid rgba(167,243,208,0.30)",
    fontSize: 11,
    lineHeight: 1,
    fontWeight: 900,
    whiteSpace: "nowrap"
  },

  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#34D399",
    display: "block"
  },

  mainTitle: {
    textAlign: "center",
    margin: "0 0 18px"
  },

  input: {
    width: "100%",
    padding: 14,
    fontSize: 17,
    marginBottom: 12,
    boxSizing: "border-box"
  },

  primary: {
    width: "100%",
    padding: 15,
    background: "#0057E7",
    color: "#fff",
    border: 0,
    borderRadius: 10,
    fontSize: 17,
    fontWeight: 800,
    cursor: "pointer"
  },

  active: {
    background: "#ECFDF5",
    color: "#065F46",
    padding: 11,
    borderRadius: 10,
    textAlign: "center",
    fontWeight: 800,
    marginBottom: 15
  },

  mapHeadingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 8
  },

  mapEyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "#6B7280"
  },

  mapStopName: {
    fontSize: 19,
    lineHeight: 1.15,
    fontWeight: 900,
    color: "#0B1D3A",
    marginTop: 3
  },

  stopCounter: {
    padding: "6px 10px",
    borderRadius: 20,
    background: "#F3F4F6",
    fontWeight: 800,
    whiteSpace: "nowrap"
  },

  mapFrame: {
    width: "100%",
    height: 270,
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
    border: "1px solid #CBD5E1",
    background: "#E5E7EB"
  },

  mapTile: {
    position: "absolute",
    width: 256,
    height: 256,
    maxWidth: "none",
    userSelect: "none",
    pointerEvents: "none"
  },

  routeOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    pointerEvents: "none"
  },

  userMarker: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    gap: 5,
    zIndex: 5
  },

  stopMarker: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    gap: 5,
    zIndex: 6
  },

  markerDotBlue: {
    display: "block",
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#0057E7",
    border: "3px solid #fff",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)"
  },

  markerDotRed: {
    display: "block",
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#DC2626",
    border: "3px solid #fff",
    boxShadow: "0 1px 5px rgba(0,0,0,0.4)"
  },

  markerLabel: {
    background: "#fff",
    padding: "3px 6px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 800,
    boxShadow: "0 1px 5px rgba(0,0,0,0.25)"
  },

  mapAttribution: {
    position: "absolute",
    right: 4,
    bottom: 3,
    zIndex: 10,
    padding: "2px 5px",
    background: "rgba(255,255,255,0.85)",
    fontSize: 9,
    color: "#374151"
  },

  mapInfo: {
    marginTop: 10,
    padding: 10,
    background: "#F8FAFC",
    borderRadius: 10,
    fontSize: 13,
    color: "#374151",
    lineHeight: 1.5
  },

  distanceStrong: {
    marginTop: 4,
    color: "#0B1D3A",
    fontWeight: 800
  },

  locationWarning: {
    marginTop: 6,
    color: "#B45309",
    fontWeight: 700
  },

  guideButton: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: 13,
    marginTop: 10,
    background: "#0057E7",
    color: "#fff",
    borderRadius: 9,
    fontWeight: 800,
    textDecoration: "none",
    textAlign: "center"
  },

  carouselHeading: {
    fontWeight: 800,
    fontSize: 18,
    marginTop: 22,
    marginBottom: 8
  },

  carouselControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 7
  },

  centerInstruction: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280"
  },

  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "1px solid #D1D5DB",
    background: "#fff",
    fontSize: 25,
    lineHeight: 1,
    cursor: "pointer"
  },

  carousel: {
    display: "flex",
    gap: 12,
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    padding: "4px 9% 14px",
    marginLeft: -18,
    marginRight: -18,
    scrollbarWidth: "thin"
  },

  stopCard: {
    flex: "0 0 82%",
    scrollSnapAlign: "center",
    borderRadius: 14,
    overflow: "hidden",
    background: "#fff",
    boxSizing: "border-box"
  },

  thumb: {
    width: "100%",
    height: 175,
    objectFit: "cover",
    display: "block",
    background: "#F3F4F6"
  },

  thumbFallback: {
    width: "100%",
    height: 175,
    background: "#E5E7EB",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: 12,
    boxSizing: "border-box"
  },

  thumbFallbackTitle: {
    fontWeight: 800,
    marginBottom: 6
  },

  thumbFallbackCoords: {
    fontSize: 12,
    color: "#374151"
  },

  stopBody: {
    padding: 14
  },

  stopNumber: {
    fontSize: 11,
    fontWeight: 800,
    color: "#6B7280",
    letterSpacing: "0.08em",
    marginBottom: 4
  },

  stopTitle: {
    fontWeight: 800,
    color: "#0B1D3A",
    fontSize: 20,
    marginBottom: 7
  },

  coordinates: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 5
  },

  detail: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4
  },

  technical: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 5
  },

  triggered: {
    color: "#047857",
    fontWeight: 700,
    marginTop: 7
  },

  playing: {
    color: "#0057E7",
    fontWeight: 800,
    marginTop: 7
  },

  queued: {
    color: "#92400E",
    fontWeight: 700,
    marginTop: 7
  },

  buttonRow: {
    display: "flex",
    gap: 8,
    marginTop: 12
  },

  playButton: {
    flex: 1,
    padding: 11,
    background: "#111827",
    color: "#fff",
    border: 0,
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer"
  },

  stopButton: {
    padding: "11px 14px",
    background: "#fff",
    color: "#111827",
    border: "1px solid #9CA3AF",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer"
  },

  mapButton: {
    flex: 1,
    padding: 11,
    background: "#E5E7EB",
    color: "#111827",
    borderRadius: 8,
    fontWeight: 700,
    textDecoration: "none",
    textAlign: "center"
  },

  secondary: {
    width: "100%",
    padding: 11,
    marginTop: 8,
    background: "#F3F4F6",
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    fontWeight: 700,
    cursor: "pointer"
  },

  exit: {
    width: "100%",
    padding: 10,
    background: "transparent",
    border: 0,
    marginTop: 10,
    color: "#6B7280",
    cursor: "pointer"
  },

  error: {
    color: "#B91C1C",
    fontWeight: 700
  },

  small: {
    textAlign: "center",
    fontSize: 11,
    color: "#6B7280",
    marginTop: 10
  }
};



