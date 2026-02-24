# Available Tools

66 tools across 10 categories.

## Document (2)

| # | Tool | Description |
|---|------|-------------|
| 1 | `get_document_info` | Get active document name, path, design type, units, save status |
| 2 | `get_design_structure` | Get full component/occurrence tree with bodies, sketches, joints |

## Sketch (10)

| # | Tool | Description |
|---|------|-------------|
| 3 | `create_sketch` | Create sketch on a plane (XY/XZ/YZ) or planar face |
| 4 | `draw_line` | Draw a line between two points |
| 5 | `draw_rectangle` | Draw rectangle (two-point or center-point mode) |
| 6 | `draw_circle` | Draw circle (center+radius or 3-point) |
| 7 | `draw_arc` | Draw arc (3-point or center-start-sweep) |
| 8 | `draw_polygon` | Draw regular polygon (3-12 sides) |
| 9 | `draw_spline` | Draw fitted spline through points |
| 10 | `add_sketch_constraint` | Add geometric constraint (parallel, perpendicular, etc.) |
| 11 | `add_sketch_dimension` | Add dimensional constraint (linear, angular, radial) |
| 12 | `get_sketch_info` | Get sketch profiles, curves, constraints |

## Modeling (15)

| # | Tool | Description |
|---|------|-------------|
| 13 | `create_extrude` | Extrude profile (distance, symmetric, toObject, all) |
| 14 | `create_revolve` | Revolve profile around an axis |
| 15 | `create_sweep` | Sweep profile along a path |
| 16 | `create_loft` | Loft between multiple profiles |
| 17 | `create_fillet` | Fillet edges with radius |
| 18 | `create_chamfer` | Chamfer edges (distance or distance+angle) |
| 19 | `create_shell` | Shell a solid body with wall thickness |
| 20 | `boolean_operation` | Join, cut, or intersect bodies |
| 21 | `create_hole` | Create holes (simple, counterbore, countersink) |
| 22 | `create_thread` | Add threads to cylindrical faces |
| 23 | `create_pattern_rectangular` | Rectangular pattern of features/bodies |
| 24 | `create_pattern_circular` | Circular pattern around an axis |
| 25 | `create_mirror` | Mirror features across a plane |
| 26 | `create_construction_plane` | Create offset/angle/midplane construction planes |
| 27 | `create_construction_axis` | Create construction axes |

## Assembly (7)

| # | Tool | Description |
|---|------|-------------|
| 28 | `create_component` | Create new empty component |
| 29 | `insert_component` | Insert component from file |
| 30 | `create_joint` | Create joint (rigid, revolute, slider, etc.) |
| 31 | `get_assembly_info` | Get occurrence tree, joints, grounded status |
| 32 | `move_component` | Translate/rotate an occurrence |
| 33 | `check_interference` | Check for body/component interference |
| 34 | `body_to_component` | Convert a body into its own component |

## Parameters (3)

| # | Tool | Description |
|---|------|-------------|
| 35 | `get_parameters` | List all user parameters |
| 36 | `set_parameter` | Modify parameter value or expression |
| 37 | `create_parameter` | Create new user parameter |

## Export/Import (6)

| # | Tool | Description |
|---|------|-------------|
| 38 | `export_stl` | Export as STL (configurable refinement) |
| 39 | `export_step` | Export as STEP |
| 40 | `export_f3d` | Export as Fusion archive |
| 41 | `export_iges` | Export as IGES |
| 42 | `export_dxf` | Export sketch as DXF |
| 43 | `import_file` | Import file (STEP, IGES, STL, OBJ, etc.) |

## CAM (6)

| # | Tool | Description |
|---|------|-------------|
| 44 | `create_cam_setup` | Create milling/turning/cutting setup |
| 45 | `add_cam_operation` | Add machining operation |
| 46 | `generate_toolpath` | Generate toolpath for operations |
| 47 | `post_process` | Generate G-code with post processor |
| 48 | `get_cam_info` | List setups, operations, tools |
| 49 | `simulate_toolpath` | Run toolpath simulation |

## Analysis (8)

| # | Tool | Description |
|---|------|-------------|
| 50 | `measure_distance` | Measure distance between entities |
| 51 | `measure_angle` | Measure angle between entities |
| 52 | `get_body_properties` | Volume, area, mass, center of mass, bounding box |
| 53 | `get_face_info` | Face geometry type, area, normal |
| 54 | `get_edge_info` | Edge geometry type, length, tangent |
| 55 | `measure_area` | Measure surface area |
| 56 | `get_bom` | Extract bill of materials |
| 57 | `section_analysis` | Create section view at a plane |

## Materials (4)

| # | Tool | Description |
|---|------|-------------|
| 58 | `set_material` | Apply material to body/component |
| 59 | `set_appearance` | Apply visual appearance |
| 60 | `list_materials` | List available materials |
| 61 | `list_appearances` | List available appearances |

## Utilities (5)

| # | Tool | Description |
|---|------|-------------|
| 62 | `capture_viewport` | Capture viewport as PNG |
| 63 | `set_viewport` | Set camera position/orientation |
| 64 | `undo` | Undo last operation |
| 65 | `redo` | Redo last undone operation |
| 66 | `execute_script` | Execute arbitrary Python in Fusion (escape hatch) |
