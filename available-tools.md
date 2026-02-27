# Available Tools

73 tools across 10 categories.

## Document (2)

| # | Tool | Description |
|---|------|-------------|
| 1 | `get_document_info` | Get active document name, path, design type, units, save status |
| 2 | `get_design_structure` | Get full component/occurrence tree with bodies, sketches, joints |

## Sketch (11)

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
| 12 | `edit_sketch_dimension` | Modify an existing dimension by parameter name or entity token |
| 13 | `get_sketch_info` | Get sketch profiles, curves, constraints |

## Modeling (16)

| # | Tool | Description |
|---|------|-------------|
| 14 | `create_extrude` | Extrude profile (distance, symmetric, toObject, all) |
| 15 | `create_revolve` | Revolve profile around an axis |
| 16 | `create_sweep` | Sweep profile along a path |
| 17 | `create_loft` | Loft between multiple profiles |
| 18 | `create_fillet` | Fillet edges with radius |
| 19 | `create_chamfer` | Chamfer edges (distance or distance+angle) |
| 20 | `create_shell` | Shell a solid body with wall thickness |
| 21 | `boolean_operation` | Join, cut, or intersect bodies |
| 22 | `create_hole` | Create holes (simple, counterbore, countersink) |
| 23 | `create_thread` | Add threads to cylindrical faces |
| 24 | `create_pattern_rectangular` | Rectangular pattern of features/bodies |
| 25 | `create_pattern_circular` | Circular pattern around an axis |
| 26 | `create_mirror` | Mirror features across a plane |
| 27 | `create_construction_plane` | Create offset/angle/midplane construction planes |
| 28 | `create_construction_axis` | Create construction axes |
| 29 | `move_body` | Translate/rotate a body |

## Assembly (11)

| # | Tool | Description |
|---|------|-------------|
| 30 | `create_component` | Create new empty component |
| 31 | `insert_component` | Insert component from file |
| 32 | `create_joint` | Create joint (rigid, revolute, slider, etc.) |
| 33 | `get_assembly_info` | Get occurrence tree, joints, grounded status |
| 34 | `move_component` | Translate/rotate an occurrence |
| 35 | `body_to_component` | Convert a body into its own component |
| 36 | `set_ground` | Ground or unground a component occurrence |
| 37 | `rename_body` | Rename an existing body |
| 38 | `rename_component` | Rename an existing component or occurrence |
| 39 | `copy_component` | Create a linked copy of a component occurrence |
| 40 | `check_interference` | Check for body/component interference |

## Parameters (3)

| # | Tool | Description |
|---|------|-------------|
| 41 | `get_parameters` | List all user parameters |
| 42 | `set_parameter` | Modify parameter value or expression |
| 43 | `create_parameter` | Create new user parameter |

## Export/Import (6)

| # | Tool | Description |
|---|------|-------------|
| 44 | `export_stl` | Export as STL (configurable refinement) |
| 45 | `export_step` | Export as STEP |
| 46 | `export_f3d` | Export as Fusion archive |
| 47 | `export_iges` | Export as IGES |
| 48 | `export_dxf` | Export sketch as DXF |
| 49 | `import_file` | Import file (STEP, IGES, STL, OBJ, etc.) |

## CAM (6)

| # | Tool | Description |
|---|------|-------------|
| 50 | `create_cam_setup` | Create milling/turning/cutting setup |
| 51 | `add_cam_operation` | Add machining operation |
| 52 | `generate_toolpath` | Generate toolpath for operations |
| 53 | `post_process` | Generate G-code with post processor |
| 54 | `get_cam_info` | List setups, operations, tools |
| 55 | `simulate_toolpath` | Run toolpath simulation |

## Analysis (9)

| # | Tool | Description |
|---|------|-------------|
| 56 | `measure_distance` | Measure distance between entities |
| 57 | `measure_angle` | Measure angle between entities |
| 58 | `get_body_properties` | Volume, area, mass, center of mass, bounding box |
| 59 | `get_body_faces` | List all faces on a body with entity tokens and geometry details |
| 60 | `get_face_info` | Face geometry type, area, normal |
| 61 | `get_edge_info` | Edge geometry type, length, tangent |
| 62 | `measure_area` | Measure surface area |
| 63 | `get_bom` | Extract bill of materials |
| 64 | `section_analysis` | Create section view at a plane |

## Materials (4)

| # | Tool | Description |
|---|------|-------------|
| 65 | `set_material` | Apply material to body/component |
| 66 | `set_appearance` | Apply visual appearance |
| 67 | `list_materials` | List available materials |
| 68 | `list_appearances` | List available appearances |

## Utilities (5)

| # | Tool | Description |
|---|------|-------------|
| 69 | `capture_viewport` | Capture viewport as PNG |
| 70 | `set_viewport` | Set camera position/orientation |
| 71 | `undo` | Undo last operation |
| 72 | `redo` | Redo last undone operation |
| 73 | `execute_script` | Execute arbitrary Python in Fusion (escape hatch) |
