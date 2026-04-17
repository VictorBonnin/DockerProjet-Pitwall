export function getGridSlotLayout(position: number) {
  const lane = Math.floor((position - 1) / 2) + 1
  const isLeft = position % 2 === 1

  return {
    laneLabel: `Ligne ${lane}`,
    side: isLeft ? "left" : "right",
    offsetClassName: isLeft
      ? "md:w-[78%] md:-translate-x-3 md:justify-self-start"
      : "md:w-[78%] md:translate-x-3 md:justify-self-end",
    rowOffsetClassName: isLeft ? "" : "md:translate-y-12",
  } as const
}
