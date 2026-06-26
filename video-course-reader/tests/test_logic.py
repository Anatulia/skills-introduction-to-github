"""Test della logica pura (nessuna dipendenza esterna richiesta)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from vcr.keyframes import build_timeline
from vcr.render import align
from vcr.transcribe import Segment
from vcr.utils import Keyframe, fmt_ts


def test_fmt_ts():
    assert fmt_ts(0) == "00:00:00"
    assert fmt_ts(61) == "00:01:01"
    assert fmt_ts(3661) == "01:01:01"


def test_timeline_includes_start():
    tl = build_timeline([], duration=10, min_gap=4, max_gap=60)
    assert tl[0] == (0.0, "start")


def test_timeline_min_gap_dedup():
    # scene a 1s e 2s sono troppo vicine (min_gap=4): la 2s viene scartata,
    # la 5s passa.
    tl = build_timeline([1.0, 2.0, 5.0], duration=20, min_gap=4, max_gap=60)
    times = [t for t, _ in tl]
    assert 2.0 not in times
    assert 5.0 in times


def test_timeline_max_gap_fills():
    # nessuna scena, durata 200s, max_gap 60 -> frame periodici a 60/120/180.
    tl = build_timeline([], duration=200, min_gap=4, max_gap=60)
    times = [t for t, _ in tl]
    assert 60.0 in times and 120.0 in times and 180.0 in times
    assert all(r == "periodic" for t, r in tl if t > 0)


def test_timeline_no_overrun():
    tl = build_timeline([5.0], duration=10, min_gap=4, max_gap=60)
    assert all(t < 10 for t, _ in tl)


def test_align_groups_speech_under_keyframe():
    kfs = [
        Keyframe(0, 0.0, "f0.jpg", "start"),
        Keyframe(1, 10.0, "f1.jpg", "scene"),
    ]
    segs = [
        Segment(1.0, 2.0, "ciao"),       # sotto kf0
        Segment(11.0, 12.0, "seconda"),  # sotto kf1
        Segment(15.0, 16.0, "terza"),    # sotto kf1
    ]
    sections = align(kfs, segs)
    assert len(sections) == 2
    assert [s.text for s in sections[0]["segments"]] == ["ciao"]
    assert [s.text for s in sections[1]["segments"]] == ["seconda", "terza"]


def test_align_no_keyframes():
    segs = [Segment(0, 1, "solo audio")]
    sections = align([], segs)
    assert len(sections) == 1 and sections[0]["keyframe"] is None


if __name__ == "__main__":
    import pytest
    raise SystemExit(pytest.main([__file__, "-v"]))
