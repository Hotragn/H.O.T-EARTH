---
title: Introduction
description: What H.O.T EARTH is, what makes it different, and how these docs are organised.
---

H.O.T EARTH is an open-source, interactive digital twin of Earth and the cosmos.
It renders 25 "worlds", from a live NASA-imagery globe with a physically computed
day/night terminator, to Mars on its real orbit, to 18,000 real galaxies mapped
in 3D. It runs in the browser, needs no API keys, and is MIT licensed.

## What makes it different

One rule shapes every decision: **real physics and real data, no fake numbers.**

- Values are computed from first principles or measured from public datasets.
- Anything illustrative (an artist's surface, a stylised layer) is labelled as
  illustrative, in the interface and in the docs.
- Every image, video, and dataset is licensed and credited.
- Each world ships a physics note and a data-sources note that state, in plain
  language, exactly how accurate each claim is and where the numbers come from.

If a thing cannot be made real, the project says so rather than faking it. That
honesty is the point, and it is why these docs spend as much time on sources and
accuracy as on APIs.

## How these docs are organised

The docs follow the [Diátaxis](https://diataxis.fr/) framework, four kinds of
documentation for four kinds of need:

- **Tutorials** teach by doing. Start here if you are new.
- **How-To Guides** solve a specific problem, like deploying or adding a layer.
- **Reference** describes the registry, the data sources, the physics methods,
  and the one HTTP route, precisely and completely.
- **Explanation** covers the why: the honesty mandate, the architecture, and the
  compute decision.

## Next step

Run it locally in about 30 seconds with the [Quickstart](/start-here/quickstart/),
then read the [Project structure](/start-here/project-structure/) to find your
way around the code.
