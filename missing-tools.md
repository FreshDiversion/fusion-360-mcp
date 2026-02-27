# Missing Fusion 360 MCP Tools

A running list of tools needed for standard design workflows.

## Resolved

1. ~~**`get_body_faces`**~~ — implemented (analysis category)
2. ~~**`edit_sketch_dimension`**~~ — implemented (sketch category)
3. ~~**`make_component_from_body`**~~ — implemented as `body_to_component` (assembly category)
4. ~~**`move_body`**~~ — implemented (modeling category)
5. ~~**`get_parameters`**~~ — implemented (parameters category)
6. ~~**`set_ground`**~~ — implemented (assembly category)
7. ~~**`rename_body`**~~ — implemented (assembly category)
8. ~~**`rename_component`**~~ — implemented (assembly category)
9. ~~**`copy_component`**~~ — implemented as linked copy (assembly category)

## Fixed Bugs

1. ~~**`body_to_component`**~~ — fixed: replaced broken MoveFeatures API with cutPasteBodies
2. ~~**`move_component`**~~ — fixed: properly cast entity to Occurrence (was failing when given a Component token)
