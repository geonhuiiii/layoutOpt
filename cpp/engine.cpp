#include <iostream>

extern "C" {
// Basic test function
double calculateArea(double width, double height) { return width * height; }

// Calculate polygon area using Shoelace formula
// points: array of x, y coordinates [x1, y1, x2, y2, ...]
// count: number of coordinates (must be even)
double calculatePolygonArea(double *points, int count) {
  if (count < 6)
    return 0.0; // Need at least 3 points (6 coords)

  double area = 0.0;
  int numPoints = count / 2;

  for (int i = 0; i < numPoints; ++i) {
    double x1 = points[2 * i];
    double y1 = points[2 * i + 1];
    double x2 = points[(2 * i + 2) % count];
    double y2 = points[(2 * i + 3) % count];

    area += (x1 * y2) - (x2 * y1);
  }

  return (area < 0 ? -area : area) / 2.0;
}
}
