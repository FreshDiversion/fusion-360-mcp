// Fusion 360 entity references
export interface EntityRef {
  entityToken: string;
  type: string;
  name?: string;
}

// 3D point (in centimeters - Fusion internal units)
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

// 3D vector
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

// Bounding box
export interface BoundingBox3D {
  min: Point3D;
  max: Point3D;
}

// Sketch profile reference
export interface ProfileRef {
  sketchName: string;
  profileIndex: number;
}

// Design structure node
export interface ComponentNode {
  name: string;
  entityToken: string;
  bodies: { name: string; entityToken: string; type: string }[];
  sketches: { name: string; entityToken: string }[];
  joints: { name: string; entityToken: string; type: string }[];
  occurrences: ComponentNode[];
}

// Document info
export interface DocumentInfo {
  name: string;
  path: string;
  designType: string;
  units: string;
  isSaved: boolean;
  activeComponentName: string;
}

// Parameter info
export interface ParameterInfo {
  name: string;
  value: number;
  expression: string;
  unit: string;
  comment: string;
}

// Body physical properties
export interface BodyProperties {
  volume: number;
  area: number;
  mass: number;
  centerOfMass: Point3D;
  boundingBox: BoundingBox3D;
  materialName: string;
}

// Sketch info
export interface SketchInfo {
  name: string;
  entityToken: string;
  plane: string;
  profileCount: number;
  curveCount: number;
  constraintCount: number;
  isFullyConstrained: boolean;
}

// CAM types
export interface CamSetupInfo {
  name: string;
  type: string;
  operationCount: number;
  stockDefined: boolean;
}

export interface CamOperationInfo {
  name: string;
  type: string;
  toolName: string;
  status: string;
}

// Standard planes
export type StandardPlane = "XY" | "XZ" | "YZ";

// Extent types for extrude
export type ExtentType = "distance" | "symmetric" | "toObject" | "all";

// Boolean operation types
export type BooleanOperationType = "join" | "cut" | "intersect" | "newBody" | "newComponent";

// Joint types
export type JointType = "rigid" | "revolute" | "slider" | "cylindrical" | "pin_slot" | "planar" | "ball";

// Hole types
export type HoleType = "simple" | "counterbore" | "countersink";

// Pattern types
export type PatternType = "features" | "bodies" | "components";

// Export formats
export type ExportFormat = "stl" | "step" | "iges" | "f3d" | "dxf" | "sat" | "smt" | "obj" | "3mf";

// Constraint types
export type SketchConstraintType =
  | "coincident"
  | "collinear"
  | "concentric"
  | "equal"
  | "fix"
  | "horizontal"
  | "vertical"
  | "midpoint"
  | "parallel"
  | "perpendicular"
  | "smooth"
  | "symmetry"
  | "tangent";
