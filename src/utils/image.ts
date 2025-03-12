

export function computeBoxLocation(left: number, top: number, width: number, height: number, coordinates: string) {
  if (coordinates) {
    if (coordinates.startsWith("[")) {
      coordinates = coordinates.substring(1)
    }
    if (coordinates.endsWith("]")) {
      coordinates = coordinates.substring(0, coordinates.length-1)
    }
    const parts = coordinates.split(",")
    if (parts.length === 4) {
      const partValues = parts.map(x => parseFloat(x))
      return [partValues[0], partValues[1], partValues[2] - partValues[0], partValues[3] - partValues[1]]
    }
  }
  if (top !== undefined && left !== undefined && height !== undefined && width !== undefined) {
    return [left, top, width, height]
  }
  return null
}
