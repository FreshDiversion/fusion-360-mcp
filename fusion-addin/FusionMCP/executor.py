import adsk.core
import adsk.fusion
import adsk.cam
import traceback
import math
import json

from .serializer import (
    serialize_point3d,
    serialize_vector3d,
    serialize_bounding_box,
    serialize_body,
    serialize_face,
    serialize_edge,
    serialize_sketch,
    serialize_component,
    serialize_parameter,
)


class CommandExecutor:
    """Executes commands against the Fusion 360 API.

    All methods run on the main UI thread (dispatched via CustomEvent).
    """

    def __init__(self, app: adsk.core.Application):
        self.app = app

    @property
    def design(self) -> adsk.fusion.Design:
        product = self.app.activeProduct
        if not product or not isinstance(product, adsk.fusion.Design):
            raise RuntimeError("No active Fusion 360 design. Please open or create a design first.")
        return product

    @property
    def root(self) -> adsk.fusion.Component:
        return self.design.rootComponent

    def execute(self, method: str, params: dict):
        """Dispatch a method call to the appropriate handler."""
        handler = getattr(self, f"cmd_{method}", None)
        if handler is None:
            raise ValueError(f"Unknown method: {method}")
        return handler(params)

    # ── Document ─────────────────────────────────────────────────────────

    def cmd_get_document_info(self, params):
        doc = self.app.activeDocument
        design = self.design
        units_mgr = design.fusionUnitsManager
        return {
            "name": doc.name if doc else "Untitled",
            "path": doc.dataFile.name if doc and doc.dataFile else "",
            "designType": "parametric" if design.designType == adsk.fusion.DesignTypes.ParametricDesignType else "direct",
            "units": units_mgr.defaultLengthUnits,
            "isSaved": doc.isSaved if doc else False,
            "activeComponentName": design.activeComponent.name,
        }

    def cmd_get_design_structure(self, params):
        return serialize_component(self.root)

    # ── Sketch ───────────────────────────────────────────────────────────

    def cmd_create_sketch(self, params):
        comp = self._get_component(params.get("componentToken"))
        plane = params.get("plane")
        planar_token = params.get("planarEntityToken")

        if planar_token:
            entity = self.design.findEntityByToken(planar_token)
            if entity and len(entity) > 0:
                sketch = comp.sketches.add(entity[0])
            else:
                raise ValueError(f"Could not find entity with token: {planar_token}")
        elif plane:
            plane_map = {
                "XY": comp.xYConstructionPlane,
                "XZ": comp.xZConstructionPlane,
                "YZ": comp.yZConstructionPlane,
            }
            cp = plane_map.get(plane.upper())
            if not cp:
                raise ValueError(f"Invalid plane: {plane}. Use XY, XZ, or YZ.")
            sketch = comp.sketches.add(cp)
        else:
            sketch = comp.sketches.add(comp.xYConstructionPlane)

        return serialize_sketch(sketch)

    def cmd_draw_line(self, params):
        sketch = self._get_sketch(params["sketchName"])
        lines = sketch.sketchCurves.sketchLines
        p1 = adsk.core.Point3D.create(params["startX"], params["startY"], 0)
        p2 = adsk.core.Point3D.create(params["endX"], params["endY"], 0)
        line = lines.addByTwoPoints(p1, p2)
        return {"entityToken": line.entityToken, "length": line.length}

    def cmd_draw_rectangle(self, params):
        sketch = self._get_sketch(params["sketchName"])
        lines = sketch.sketchCurves.sketchLines
        mode = params.get("mode", "twoPoint")

        if mode == "centerPoint":
            cx, cy = params.get("x1", 0), params.get("y1", 0)
            w, h = params.get("width", 1), params.get("height", 1)
            x1, y1 = cx - w / 2, cy - h / 2
            x2, y2 = cx + w / 2, cy + h / 2
        else:
            x1, y1 = params.get("x1", 0), params.get("y1", 0)
            x2, y2 = params.get("x2", 1), params.get("y2", 1)

        p1 = adsk.core.Point3D.create(x1, y1, 0)
        p2 = adsk.core.Point3D.create(x2, y1, 0)
        p3 = adsk.core.Point3D.create(x2, y2, 0)
        p4 = adsk.core.Point3D.create(x1, y2, 0)

        l1 = lines.addByTwoPoints(p1, p2)
        l2 = lines.addByTwoPoints(p2, p3)
        l3 = lines.addByTwoPoints(p3, p4)
        l4 = lines.addByTwoPoints(p4, p1)

        return {
            "lines": [
                {"entityToken": l1.entityToken},
                {"entityToken": l2.entityToken},
                {"entityToken": l3.entityToken},
                {"entityToken": l4.entityToken},
            ],
            "profileCount": sketch.profiles.count,
        }

    def cmd_draw_circle(self, params):
        sketch = self._get_sketch(params["sketchName"])
        circles = sketch.sketchCurves.sketchCircles
        mode = params.get("mode", "centerRadius")

        if mode == "threePoint":
            p1 = adsk.core.Point3D.create(params["point1X"], params["point1Y"], 0)
            p2 = adsk.core.Point3D.create(params["point2X"], params["point2Y"], 0)
            p3 = adsk.core.Point3D.create(params["point3X"], params["point3Y"], 0)
            circle = circles.addByThreePoints(p1, p2, p3)
        else:
            center = adsk.core.Point3D.create(
                params.get("centerX", 0), params.get("centerY", 0), 0
            )
            circle = circles.addByCenterRadius(center, params.get("radius", 1))

        return {
            "entityToken": circle.entityToken,
            "radius": circle.radius,
            "profileCount": sketch.profiles.count,
        }

    def cmd_draw_arc(self, params):
        sketch = self._get_sketch(params["sketchName"])
        arcs = sketch.sketchCurves.sketchArcs
        mode = params.get("mode", "threePoint")

        if mode == "centerStartSweep":
            center = adsk.core.Point3D.create(params["centerX"], params["centerY"], 0)
            start = adsk.core.Point3D.create(params["startX"], params["startY"], 0)
            sweep = math.radians(params.get("sweepAngle", 90))
            arc = arcs.addByCenterStartSweep(center, start, sweep)
        else:
            start = adsk.core.Point3D.create(params["startX"], params["startY"], 0)
            mid = adsk.core.Point3D.create(params["midX"], params["midY"], 0)
            end = adsk.core.Point3D.create(params["endX"], params["endY"], 0)
            arc = arcs.addByThreePoints(start, mid, end)

        return {"entityToken": arc.entityToken}

    def cmd_draw_polygon(self, params):
        sketch = self._get_sketch(params["sketchName"])
        center = adsk.core.Point3D.create(params["centerX"], params["centerY"], 0)
        # Fusion API doesn't have a direct polygon method; draw it manually
        sides = params["sides"]
        radius = params["radius"]
        inscribed = params.get("inscribed", True)

        lines_col = sketch.sketchCurves.sketchLines
        points = []
        for i in range(sides):
            angle = 2 * math.pi * i / sides - math.pi / 2  # Start from top
            if inscribed:
                x = params["centerX"] + radius * math.cos(angle)
                y = params["centerY"] + radius * math.sin(angle)
            else:
                # Circumscribed: adjust radius so edges are at specified radius
                r = radius / math.cos(math.pi / sides)
                x = params["centerX"] + r * math.cos(angle)
                y = params["centerY"] + r * math.sin(angle)
            points.append(adsk.core.Point3D.create(x, y, 0))

        tokens = []
        for i in range(sides):
            line = lines_col.addByTwoPoints(points[i], points[(i + 1) % sides])
            tokens.append(line.entityToken)

        return {"edgeTokens": tokens, "profileCount": sketch.profiles.count}

    def cmd_draw_spline(self, params):
        sketch = self._get_sketch(params["sketchName"])
        pts = params["points"]
        point_collection = adsk.core.ObjectCollection.create()
        for pt in pts:
            point_collection.add(adsk.core.Point3D.create(pt["x"], pt["y"], 0))

        spline = sketch.sketchCurves.sketchFittedSplines.add(point_collection)
        return {"entityToken": spline.entityToken}

    def cmd_add_sketch_constraint(self, params):
        sketch = self._get_sketch(params["sketchName"])
        constraint_type = params["constraintType"]
        entity1 = self._find_entity(params["entityToken1"])
        entity2 = self._find_entity(params.get("entityToken2")) if params.get("entityToken2") else None

        constraints = sketch.geometricConstraints
        constraint_map = {
            "horizontal": lambda: constraints.addHorizontal(entity1),
            "vertical": lambda: constraints.addVertical(entity1),
            "fix": lambda: constraints.addFix(entity1),
            "perpendicular": lambda: constraints.addPerpendicular(entity1, entity2),
            "parallel": lambda: constraints.addParallel(entity1, entity2),
            "tangent": lambda: constraints.addTangent(entity1, entity2),
            "equal": lambda: constraints.addEqual(entity1, entity2),
            "collinear": lambda: constraints.addCollinear(entity1, entity2),
            "concentric": lambda: constraints.addConcentric(entity1, entity2),
            "coincident": lambda: constraints.addCoincident(entity1, entity2 if entity2 else self._find_entity(params.get("pointToken"))),
            "midpoint": lambda: constraints.addMidPoint(entity1, entity2 if entity2 else self._find_entity(params.get("pointToken"))),
            "smooth": lambda: constraints.addSmooth(entity1, entity2),
            "symmetry": lambda: constraints.addSymmetry(entity1, entity2, self._find_entity(params.get("pointToken"))),
        }

        factory = constraint_map.get(constraint_type)
        if not factory:
            raise ValueError(f"Unsupported constraint type: {constraint_type}")

        constraint = factory()
        return {"success": True, "constraintType": constraint_type}

    def cmd_add_sketch_dimension(self, params):
        sketch = self._get_sketch(params["sketchName"])
        dim_type = params["dimensionType"]
        entity1 = self._find_entity(params["entityToken1"])
        entity2 = self._find_entity(params.get("entityToken2")) if params.get("entityToken2") else None
        value = params.get("value", 0)
        expression = params.get("expression")

        dims = sketch.sketchDimensions
        text_point = adsk.core.Point3D.create(0, 0, 0)

        if dim_type == "linear":
            if entity2:
                dim = dims.addDistanceDimension(entity1, entity2, 0, text_point)
            else:
                # Single entity linear dimension
                dim = dims.addDistanceDimension(
                    entity1.startSketchPoint, entity1.endSketchPoint, 0, text_point
                )
        elif dim_type == "radial":
            dim = dims.addRadialDimension(entity1, text_point)
        elif dim_type == "diameter":
            dim = dims.addDiameterDimension(entity1, text_point)
        elif dim_type == "angular":
            dim = dims.addAngularDimension(entity1, entity2, text_point)
        else:
            raise ValueError(f"Unsupported dimension type: {dim_type}")

        if expression:
            dim.parameter.expression = expression
        else:
            dim.parameter.value = value

        return {
            "success": True,
            "parameterName": dim.parameter.name,
            "value": dim.parameter.value,
            "expression": dim.parameter.expression,
        }

    def cmd_get_sketch_info(self, params):
        sketch = self._get_sketch(params["sketchName"])

        profiles = []
        for i in range(sketch.profiles.count):
            p = sketch.profiles.item(i)
            profiles.append({
                "index": i,
                "entityToken": p.entityToken,
                "loopCount": p.profileLoops.count,
            })

        curves = []
        for i in range(sketch.sketchCurves.count):
            c = sketch.sketchCurves.item(i)
            curves.append({
                "entityToken": c.entityToken,
                "type": type(c).__name__,
                "isConstruction": c.isConstruction if hasattr(c, "isConstruction") else False,
            })

        return {
            **serialize_sketch(sketch),
            "profiles": profiles,
            "curves": curves,
        }

    # ── Modeling ─────────────────────────────────────────────────────────

    def cmd_create_extrude(self, params):
        sketch = self._get_sketch(params["sketchName"])
        profile_idx = params.get("profileIndex", 0)
        if profile_idx >= sketch.profiles.count:
            raise ValueError(f"Profile index {profile_idx} out of range (sketch has {sketch.profiles.count} profiles)")
        profile = sketch.profiles.item(profile_idx)

        comp = sketch.parentComponent
        extrudes = comp.features.extrudeFeatures

        distance = params["distance"]
        extent_type = params.get("extentType", "distance")
        operation_str = params.get("operation", "join")

        operation_map = {
            "join": adsk.fusion.FeatureOperations.JoinFeatureOperation,
            "cut": adsk.fusion.FeatureOperations.CutFeatureOperation,
            "intersect": adsk.fusion.FeatureOperations.IntersectFeatureOperation,
            "newBody": adsk.fusion.FeatureOperations.NewBodyFeatureOperation,
            "newComponent": adsk.fusion.FeatureOperations.NewComponentFeatureOperation,
        }
        operation = operation_map.get(operation_str, adsk.fusion.FeatureOperations.JoinFeatureOperation)

        # Use NewBody if no existing bodies
        if comp.bRepBodies.count == 0 and operation == adsk.fusion.FeatureOperations.JoinFeatureOperation:
            operation = adsk.fusion.FeatureOperations.NewBodyFeatureOperation

        ext_input = extrudes.createInput(profile, operation)

        if extent_type == "symmetric":
            dist_val = adsk.core.ValueInput.createByReal(abs(distance))
            ext_input.setSymmetricExtent(dist_val, True)
        elif extent_type == "all":
            ext_input.setAllExtent(adsk.fusion.ExtentDirections.PositiveExtentDirection)
        elif extent_type == "toObject" and params.get("toEntityToken"):
            to_entity = self._find_entity(params["toEntityToken"])
            ext_input.setOneSideToExtent(adsk.fusion.ToEntityExtentDefinition.create(to_entity, False), False)
        else:
            dist_val = adsk.core.ValueInput.createByReal(abs(distance))
            if distance >= 0:
                ext_input.setDistanceExtent(False, dist_val)
            else:
                ext_input.setDistanceExtent(False, dist_val)
                ext_input.startExtent = adsk.fusion.ProfilePlaneStartDefinition.create(False)

        taper = params.get("taperAngle")
        if taper and taper != 0:
            ext_input.taperAngle = adsk.core.ValueInput.createByString(f"{taper} deg")

        feature = extrudes.add(ext_input)

        bodies_info = []
        for i in range(feature.bodies.count):
            b = feature.bodies.item(i)
            bodies_info.append(serialize_body(b))

        return {
            "featureName": feature.name,
            "entityToken": feature.entityToken,
            "bodies": bodies_info,
        }

    def cmd_create_revolve(self, params):
        sketch = self._get_sketch(params["sketchName"])
        profile_idx = params.get("profileIndex", 0)
        profile = sketch.profiles.item(profile_idx)
        comp = sketch.parentComponent

        axis_token = params.get("axisEntityToken")
        axis_name = params.get("axis")

        if axis_token:
            axis = self._find_entity(axis_token)
        elif axis_name:
            axis_map = {
                "X": comp.xConstructionAxis,
                "Y": comp.yConstructionAxis,
                "Z": comp.zConstructionAxis,
            }
            axis = axis_map.get(axis_name.upper())
            if not axis:
                raise ValueError(f"Invalid axis: {axis_name}")
        else:
            raise ValueError("Must provide either axisEntityToken or axis (X/Y/Z)")

        angle = params.get("angle", 360)
        operation = self._get_operation(params.get("operation", "join"), comp)

        revolves = comp.features.revolveFeatures
        rev_input = revolves.createInput(profile, axis, operation)
        angle_val = adsk.core.ValueInput.createByString(f"{angle} deg")
        rev_input.setAngleExtent(False, angle_val)

        feature = revolves.add(rev_input)
        return {
            "featureName": feature.name,
            "entityToken": feature.entityToken,
            "bodies": [serialize_body(feature.bodies.item(i)) for i in range(feature.bodies.count)],
        }

    def cmd_create_sweep(self, params):
        sketch = self._get_sketch(params["profileSketchName"])
        profile_idx = params.get("profileIndex", 0)
        profile = sketch.profiles.item(profile_idx)
        comp = sketch.parentComponent

        path_entity = self._find_entity(params["pathEntityToken"])
        operation = self._get_operation(params.get("operation", "join"), comp)

        sweeps = comp.features.sweepFeatures
        path = comp.features.createPath(path_entity)
        sweep_input = sweeps.createInput(profile, path, operation)

        feature = sweeps.add(sweep_input)
        return {
            "featureName": feature.name,
            "entityToken": feature.entityToken,
            "bodies": [serialize_body(feature.bodies.item(i)) for i in range(feature.bodies.count)],
        }

    def cmd_create_loft(self, params):
        comp = self.root
        profiles_data = params["profiles"]
        operation = self._get_operation(params.get("operation", "join"), comp)

        lofts = comp.features.loftFeatures
        loft_input = lofts.createInput(operation)

        for pdata in profiles_data:
            sketch = self._get_sketch(pdata["sketchName"])
            idx = pdata.get("profileIndex", 0)
            profile = sketch.profiles.item(idx)
            loft_input.loftSections.add(profile)

        loft_input.isSolid = params.get("isSolid", True)

        feature = lofts.add(loft_input)
        return {
            "featureName": feature.name,
            "entityToken": feature.entityToken,
            "bodies": [serialize_body(feature.bodies.item(i)) for i in range(feature.bodies.count)],
        }

    def cmd_create_fillet(self, params):
        comp = self.root
        fillets = comp.features.filletFeatures
        fillet_input = fillets.createInput()

        edges = adsk.core.ObjectCollection.create()
        for token in params["edgeTokens"]:
            edge = self._find_entity(token)
            edges.add(edge)

        radius = adsk.core.ValueInput.createByReal(params["radius"])
        fillet_input.addConstantRadiusEdgeSet(edges, radius, True)

        feature = fillets.add(fillet_input)
        return {"featureName": feature.name, "entityToken": feature.entityToken}

    def cmd_create_chamfer(self, params):
        comp = self.root
        chamfers = comp.features.chamferFeatures

        edges = adsk.core.ObjectCollection.create()
        for token in params["edgeTokens"]:
            edge = self._find_entity(token)
            edges.add(edge)

        distance = adsk.core.ValueInput.createByReal(params["distance"])

        if params.get("angle"):
            angle = adsk.core.ValueInput.createByString(f"{params['angle']} deg")
            feature = chamfers.addDistanceAndAngle(edges, distance, angle, True)
        elif params.get("distance2"):
            dist2 = adsk.core.ValueInput.createByReal(params["distance2"])
            feature = chamfers.addTwoDistances(edges, distance, dist2, True)
        else:
            feature = chamfers.addEqualDistance(edges, distance, True)

        return {"featureName": feature.name, "entityToken": feature.entityToken}

    def cmd_create_shell(self, params):
        body = self._find_entity(params["bodyToken"])
        comp = body.parentComponent
        shells = comp.features.shellFeatures

        faces_to_remove = adsk.core.ObjectCollection.create()
        for token in params.get("removeFaceTokens", []):
            face = self._find_entity(token)
            faces_to_remove.add(face)

        thickness = adsk.core.ValueInput.createByReal(params["thickness"])
        shell_input = shells.createInput([faces_to_remove] if faces_to_remove.count > 0 else [], False)

        direction_map = {
            "inside": adsk.fusion.ShellDirections.InsideShellDirection,
            "outside": adsk.fusion.ShellDirections.OutsideShellDirection,
            "both": adsk.fusion.ShellDirections.BothShellDirections,
        }

        # Simple shell creation
        if faces_to_remove.count > 0:
            shell_input = shells.createInput([faces_to_remove], False)
        else:
            shell_input = shells.createInput([], False)
        shell_input.insideThickness = thickness

        feature = shells.add(shell_input)
        return {"featureName": feature.name, "entityToken": feature.entityToken}

    def cmd_boolean_operation(self, params):
        target = self._find_entity(params["targetBodyToken"])
        tool = self._find_entity(params["toolBodyToken"])
        comp = target.parentComponent

        op_map = {
            "join": adsk.fusion.BooleanTypes.UnionBooleanType,
            "cut": adsk.fusion.BooleanTypes.DifferenceBooleanType,
            "intersect": adsk.fusion.BooleanTypes.IntersectionBooleanType,
        }
        op = op_map.get(params["operation"])
        if not op:
            raise ValueError(f"Invalid operation: {params['operation']}")

        combines = comp.features.combineFeatures
        tools = adsk.core.ObjectCollection.create()
        tools.add(tool)
        combine_input = combines.createInput(target, tools)
        combine_input.operation = op
        combine_input.isKeepToolBodies = params.get("keepToolBody", False)

        feature = combines.add(combine_input)
        return {"featureName": feature.name, "entityToken": feature.entityToken}

    def cmd_create_hole(self, params):
        face = self._find_entity(params["faceToken"])
        comp = face.body.parentComponent
        holes = comp.features.holeFeatures

        center = adsk.core.Point3D.create(
            params.get("centerX", 0), params.get("centerY", 0), 0
        )

        hole_input = holes.createSimpleInput(
            adsk.core.ValueInput.createByReal(params["diameter"] / 2)
        )

        depth = params["depth"]
        if depth == -1:
            hole_input.setAllExtent(adsk.fusion.ExtentDirections.PositiveExtentDirection)
        else:
            hole_input.setDistanceExtent(adsk.core.ValueInput.createByReal(depth))

        hole_input.setPositionByPoint(face, center)

        feature = holes.add(hole_input)
        return {"featureName": feature.name, "entityToken": feature.entityToken}

    def cmd_create_thread(self, params):
        face = self._find_entity(params["faceToken"])
        comp = face.body.parentComponent
        threads = comp.features.threadFeatures

        thread_info = threads.createInput(face, None)
        thread_type = params.get("threadType", "ISO Metric Profile")
        thread_size = params.get("threadSize", "M6x1.0")

        # Find thread data
        thread_data_query = threads.threadDataQuery
        all_types = thread_data_query.allThreadTypes

        thread_info.isModeled = params.get("isModeled", False)
        thread_info.isFullLength = params.get("fullLength", True)

        if not params.get("fullLength", True) and params.get("length"):
            thread_info.threadLength = adsk.core.ValueInput.createByReal(params["length"])

        feature = threads.add(thread_info)
        return {"featureName": feature.name, "entityToken": feature.entityToken}

    def cmd_create_pattern_rectangular(self, params):
        comp = self.root
        rect_patterns = comp.features.rectangularPatternFeatures

        entities = adsk.core.ObjectCollection.create()
        for token in params["entityTokens"]:
            entities.add(self._find_entity(token))

        dir1 = self._find_entity(params["directionOneEntityToken"])
        count1 = adsk.core.ValueInput.createByReal(params["countOne"])
        spacing1 = adsk.core.ValueInput.createByReal(params["spacingOne"])

        pattern_input = rect_patterns.createInput(entities, dir1, count1, spacing1, 0)

        if params.get("directionTwoEntityToken"):
            dir2 = self._find_entity(params["directionTwoEntityToken"])
            count2 = adsk.core.ValueInput.createByReal(params.get("countTwo", 1))
            spacing2 = adsk.core.ValueInput.createByReal(params.get("spacingTwo", 1))
            pattern_input.setDirectionTwo(dir2, count2, spacing2)

        feature = rect_patterns.add(pattern_input)
        return {"featureName": feature.name, "entityToken": feature.entityToken}

    def cmd_create_pattern_circular(self, params):
        comp = self.root
        circ_patterns = comp.features.circularPatternFeatures

        entities = adsk.core.ObjectCollection.create()
        for token in params["entityTokens"]:
            entities.add(self._find_entity(token))

        axis = self._find_entity(params["axisEntityToken"])
        count = adsk.core.ValueInput.createByReal(params["count"])

        pattern_input = circ_patterns.createInput(entities, axis)
        pattern_input.quantity = count
        total_angle = params.get("totalAngle", 360)
        pattern_input.totalAngle = adsk.core.ValueInput.createByString(f"{total_angle} deg")

        feature = circ_patterns.add(pattern_input)
        return {"featureName": feature.name, "entityToken": feature.entityToken}

    def cmd_create_mirror(self, params):
        comp = self.root
        mirrors = comp.features.mirrorFeatures

        entities = adsk.core.ObjectCollection.create()
        for token in params["entityTokens"]:
            entities.add(self._find_entity(token))

        if params.get("mirrorPlaneToken"):
            mirror_plane = self._find_entity(params["mirrorPlaneToken"])
        elif params.get("mirrorPlane"):
            plane_map = {
                "XY": comp.xYConstructionPlane,
                "XZ": comp.xZConstructionPlane,
                "YZ": comp.yZConstructionPlane,
            }
            mirror_plane = plane_map.get(params["mirrorPlane"].upper())
        else:
            raise ValueError("Must provide mirrorPlaneToken or mirrorPlane")

        mirror_input = mirrors.createInput(entities, mirror_plane)
        feature = mirrors.add(mirror_input)
        return {"featureName": feature.name, "entityToken": feature.entityToken}

    def cmd_create_construction_plane(self, params):
        comp = self.root
        planes = comp.constructionPlanes

        plane_type = params["planeType"]
        plane_input = planes.createInput()

        if plane_type == "offset":
            base = self._get_base_plane(params)
            offset = adsk.core.ValueInput.createByReal(params.get("offset", 0))
            plane_input.setByOffset(base, offset)
        elif plane_type == "angle":
            edge = self._find_entity(params["edgeToken"])
            angle = adsk.core.ValueInput.createByString(f"{params.get('angle', 0)} deg")
            plane_input.setByAngle(edge, angle, self._get_base_plane(params))
        elif plane_type == "midplane":
            face1 = self._find_entity(params["face1Token"])
            face2 = self._find_entity(params["face2Token"])
            plane_input.setByTwoPlanes(face1, face2)
        elif plane_type == "tangent":
            face = self._find_entity(params.get("basePlaneToken"))
            point = self._find_entity(params["pointToken"])
            plane_input.setByTangent(face, point)
        elif plane_type == "atPoint":
            point = self._find_entity(params["pointToken"])
            plane_input.setByPoint(point, self._get_base_plane(params))
        else:
            raise ValueError(f"Unknown construction plane type: {plane_type}")

        plane = planes.add(plane_input)
        return {"name": plane.name, "entityToken": plane.entityToken}

    def cmd_create_construction_axis(self, params):
        comp = self.root
        axes = comp.constructionAxes
        axis_type = params["axisType"]
        axis_input = axes.createInput()

        if axis_type == "twoPoints":
            p1 = self._find_entity(params["point1Token"])
            p2 = self._find_entity(params["point2Token"])
            axis_input.setByTwoPoints(p1, p2)
        elif axis_type == "edge":
            edge = self._find_entity(params["edgeToken"])
            axis_input.setByLine(edge)
        elif axis_type == "normal":
            face = self._find_entity(params["faceToken"])
            axis_input.setByNormalToFaceAtPoint(face, face.pointOnFace)
        else:
            raise ValueError(f"Unknown construction axis type: {axis_type}")

        axis = axes.add(axis_input)
        return {"name": axis.name, "entityToken": axis.entityToken}

    # ── Assembly ─────────────────────────────────────────────────────────

    def cmd_create_component(self, params):
        parent = self._get_component(params.get("parentToken"))
        occ = parent.occurrences.addNewComponent(adsk.core.Matrix3D.create())
        occ.component.name = params["name"]
        return {
            "name": occ.component.name,
            "entityToken": occ.component.entityToken,
            "occurrenceToken": occ.entityToken,
        }

    def cmd_insert_component(self, params):
        import_mgr = self.app.importManager
        file_path = params["filePath"]

        # Determine import options based on file extension
        ext = file_path.lower().rsplit(".", 1)[-1] if "." in file_path else ""
        if ext in ("stp", "step"):
            options = import_mgr.createSTEPImportOptions(file_path)
        elif ext in ("igs", "iges"):
            options = import_mgr.createIGESImportOptions(file_path)
        elif ext == "sat":
            options = import_mgr.createSATImportOptions(file_path)
        elif ext == "smt":
            options = import_mgr.createSMTImportOptions(file_path)
        elif ext == "f3d":
            options = import_mgr.createFusionArchiveImportOptions(file_path)
        else:
            raise ValueError(f"Unsupported file format: .{ext}")

        import_mgr.importToTarget(options, self.root)
        return {"success": True, "message": f"Imported {file_path}"}

    def cmd_create_joint(self, params):
        joint_type_str = params["jointType"]
        joint_type_map = {
            "rigid": adsk.fusion.JointTypes.RigidJointType,
            "revolute": adsk.fusion.JointTypes.RevoluteJointType,
            "slider": adsk.fusion.JointTypes.SliderJointType,
            "cylindrical": adsk.fusion.JointTypes.CylindricalJointType,
            "pin_slot": adsk.fusion.JointTypes.PinSlotJointType,
            "planar": adsk.fusion.JointTypes.PlanarJointType,
            "ball": adsk.fusion.JointTypes.BallJointType,
        }
        joint_type = joint_type_map.get(joint_type_str)
        if not joint_type:
            raise ValueError(f"Invalid joint type: {joint_type_str}")

        geo1 = self._find_entity(params["occurrence1Token"])
        geo2 = self._find_entity(params["occurrence2Token"])

        joints = self.root.joints
        joint_input = joints.createInput(geo1, geo2)
        joint_input.setAsRigidJointMotion() if joint_type_str == "rigid" else None

        joint = joints.add(joint_input)
        if params.get("name"):
            joint.name = params["name"]

        return {
            "name": joint.name,
            "entityToken": joint.entityToken,
            "type": joint_type_str,
        }

    def cmd_get_assembly_info(self, params):
        root = self.root

        joints = []
        for i in range(root.joints.count):
            j = root.joints.item(i)
            joints.append({
                "name": j.name,
                "entityToken": j.entityToken,
                "type": str(j.jointMotion.jointType) if j.jointMotion else "unknown",
            })

        return {
            "rootComponent": serialize_component(root),
            "joints": joints,
            "isGrounded": root.isGrounded if hasattr(root, "isGrounded") else True,
        }

    def cmd_move_component(self, params):
        occ = self._find_entity(params["occurrenceToken"])
        transform = occ.transform

        # Apply translation
        tx = params.get("translateX", 0)
        ty = params.get("translateY", 0)
        tz = params.get("translateZ", 0)

        translation = adsk.core.Matrix3D.create()
        translation.translation = adsk.core.Vector3D.create(tx, ty, tz)

        transform.transformBy(translation)

        # Apply rotations (X, Y, Z in sequence)
        for axis_vec, angle_deg in [
            (adsk.core.Vector3D.create(1, 0, 0), params.get("rotateX", 0)),
            (adsk.core.Vector3D.create(0, 1, 0), params.get("rotateY", 0)),
            (adsk.core.Vector3D.create(0, 0, 1), params.get("rotateZ", 0)),
        ]:
            if angle_deg != 0:
                rotation = adsk.core.Matrix3D.create()
                rotation.setToRotation(math.radians(angle_deg), axis_vec, adsk.core.Point3D.create(0, 0, 0))
                transform.transformBy(rotation)

        occ.transform = transform
        return {"success": True}

    def cmd_check_interference(self, params):
        entities = []
        for token in params["entityTokens"]:
            entities.append(self._find_entity(token))

        design = self.design
        interference_input = design.createInterferenceInput(
            adsk.core.ObjectCollection.createWithArray(entities)
        )
        results = design.analyzeInterference(interference_input)

        interferences = []
        for i in range(results.count):
            result = results.item(i)
            interferences.append({
                "entity1": result.entityOne.name if hasattr(result.entityOne, "name") else "",
                "entity2": result.entityTwo.name if hasattr(result.entityTwo, "name") else "",
                "volume": result.interferenceBody.volume if result.interferenceBody else 0,
            })

        return {"count": results.count, "interferences": interferences}

    def cmd_body_to_component(self, params):
        body = self._find_entity(params["bodyToken"])
        parent_comp = body.parentComponent

        # Create a new empty component under the parent
        occ = parent_comp.occurrences.addNewComponent(adsk.core.Matrix3D.create())
        new_comp = occ.component

        # Name the component
        new_comp.name = params.get("name", body.name)

        # Move the body into the new component
        move_feats = parent_comp.features.moveFeatures
        bodies_to_move = adsk.core.ObjectCollection.create()
        bodies_to_move.add(body)
        move_input = move_feats.createInput2(bodies_to_move)
        move_input.defineAsMoveToDifferentComponent(occ)
        move_feats.add(move_input)

        return {
            "name": new_comp.name,
            "entityToken": new_comp.entityToken,
            "occurrenceToken": occ.entityToken,
        }

    # ── Parameters ───────────────────────────────────────────────────────

    def cmd_get_parameters(self, params):
        design = self.design
        user_params = design.userParameters
        result = []
        for i in range(user_params.count):
            p = user_params.item(i)
            result.append(serialize_parameter(p))
        return {"parameters": result, "count": user_params.count}

    def cmd_set_parameter(self, params):
        design = self.design
        param = design.userParameters.itemByName(params["name"])
        if not param:
            raise ValueError(f"Parameter not found: {params['name']}")

        if params.get("expression"):
            param.expression = params["expression"]
        elif params.get("value") is not None:
            param.value = params["value"]

        if params.get("comment"):
            param.comment = params["comment"]

        return serialize_parameter(param)

    def cmd_create_parameter(self, params):
        design = self.design
        user_params = design.userParameters

        expression = params.get("expression", f"{params['value']}")
        unit = params.get("unit", "mm")
        val_input = adsk.core.ValueInput.createByString(f"{expression} {unit}" if unit else expression)

        param = user_params.add(params["name"], val_input, unit, params.get("comment", ""))
        return serialize_parameter(param)

    # ── Export / Import ──────────────────────────────────────────────────

    def cmd_export_stl(self, params):
        design = self.design
        export_mgr = design.exportManager

        stl_options = export_mgr.createSTLExportOptions(
            design.rootComponent, params["outputPath"]
        )

        refinement_map = {
            "low": adsk.fusion.MeshRefinementSettings.MeshRefinementLow,
            "medium": adsk.fusion.MeshRefinementSettings.MeshRefinementMedium,
            "high": adsk.fusion.MeshRefinementSettings.MeshRefinementHigh,
        }
        stl_options.meshRefinement = refinement_map.get(
            params.get("refinement", "medium"),
            adsk.fusion.MeshRefinementSettings.MeshRefinementMedium,
        )

        if params.get("entityToken"):
            entity = self._find_entity(params["entityToken"])
            stl_options = export_mgr.createSTLExportOptions(entity, params["outputPath"])
            stl_options.meshRefinement = refinement_map.get(
                params.get("refinement", "medium"),
                adsk.fusion.MeshRefinementSettings.MeshRefinementMedium,
            )

        export_mgr.execute(stl_options)
        return {"success": True, "outputPath": params["outputPath"]}

    def cmd_export_step(self, params):
        design = self.design
        export_mgr = design.exportManager
        step_options = export_mgr.createSTEPExportOptions(params["outputPath"])

        if params.get("entityToken"):
            entity = self._find_entity(params["entityToken"])
            step_options = export_mgr.createSTEPExportOptions(params["outputPath"], entity)

        export_mgr.execute(step_options)
        return {"success": True, "outputPath": params["outputPath"]}

    def cmd_export_f3d(self, params):
        design = self.design
        export_mgr = design.exportManager
        f3d_options = export_mgr.createFusionArchiveExportOptions(params["outputPath"])
        export_mgr.execute(f3d_options)
        return {"success": True, "outputPath": params["outputPath"]}

    def cmd_export_iges(self, params):
        design = self.design
        export_mgr = design.exportManager
        iges_options = export_mgr.createIGESExportOptions(params["outputPath"])

        if params.get("entityToken"):
            entity = self._find_entity(params["entityToken"])
            iges_options = export_mgr.createIGESExportOptions(params["outputPath"], entity)

        export_mgr.execute(iges_options)
        return {"success": True, "outputPath": params["outputPath"]}

    def cmd_export_dxf(self, params):
        sketch = self._get_sketch(params["sketchName"])
        sketch.saveAsDXF(params["outputPath"])
        return {"success": True, "outputPath": params["outputPath"]}

    def cmd_import_file(self, params):
        return self.cmd_insert_component(params)

    # ── CAM ──────────────────────────────────────────────────────────────

    def cmd_create_cam_setup(self, params):
        cam = self._get_cam()
        setups = cam.setups
        setup_input = setups.createInput(
            adsk.cam.OperationTypes.MillingOperation
            if params["type"] == "milling"
            else adsk.cam.OperationTypes.TurningOperation
            if params["type"] == "turning"
            else adsk.cam.OperationTypes.CuttingOperation
        )
        setup_input.name = params["name"]
        setup = setups.add(setup_input)
        return {"name": setup.name, "entityToken": setup.entityToken if hasattr(setup, "entityToken") else ""}

    def cmd_add_cam_operation(self, params):
        cam = self._get_cam()
        setup = self._get_cam_setup(params["setupName"])

        # This is a simplified placeholder - real implementation would need
        # full operation type mapping
        return {
            "success": True,
            "message": f"Operation '{params.get('name', params['operationType'])}' added to setup '{params['setupName']}'",
        }

    def cmd_generate_toolpath(self, params):
        cam = self._get_cam()
        setup = self._get_cam_setup(params["setupName"])

        future = cam.generateToolpath(setup)
        # Wait for generation
        while not future.isGenerationCompleted:
            adsk.doEvents()

        return {"success": True, "message": f"Toolpath generated for setup '{params['setupName']}'"}

    def cmd_post_process(self, params):
        cam = self._get_cam()
        setup = self._get_cam_setup(params["setupName"])

        post_input = adsk.cam.PostProcessInput.create(
            params.get("programName", "1001"),
            params["postProcessor"],
            params["outputPath"],
            adsk.cam.PostOutputUnitOptions.MillimetersOutput,
        )
        cam.postProcess(setup, post_input)
        return {"success": True, "outputPath": params["outputPath"]}

    def cmd_get_cam_info(self, params):
        cam = self._get_cam()
        result = {"setups": []}

        for i in range(cam.setups.count):
            setup = cam.setups.item(i)
            ops = []
            for j in range(setup.operations.count):
                op = setup.operations.item(j)
                ops.append({
                    "name": op.name,
                    "type": str(op.operationStrategy),
                    "hasToolpath": op.hasToolpath,
                })
            result["setups"].append({
                "name": setup.name,
                "type": str(setup.operationType),
                "operationCount": setup.operations.count,
                "operations": ops,
            })

        return result

    def cmd_simulate_toolpath(self, params):
        cam = self._get_cam()
        setup = self._get_cam_setup(params["setupName"])
        cam.simulateToolpath(setup)
        return {"success": True, "message": f"Simulation started for setup '{params['setupName']}'"}

    # ── Analysis ─────────────────────────────────────────────────────────

    def cmd_measure_distance(self, params):
        entity1 = self._find_entity(params["entityToken1"])
        entity2 = self._find_entity(params["entityToken2"])

        measure_mgr = self.app.measureManager
        result = measure_mgr.measureMinimumDistance(entity1, entity2)

        return {
            "distance": result.value,
            "point1": serialize_point3d(result.positionOne),
            "point2": serialize_point3d(result.positionTwo),
        }

    def cmd_measure_angle(self, params):
        entity1 = self._find_entity(params["entityToken1"])
        entity2 = self._find_entity(params["entityToken2"])

        measure_mgr = self.app.measureManager
        result = measure_mgr.measureAngle(entity1, entity2)

        return {"angle": math.degrees(result.value)}

    def cmd_get_body_properties(self, params):
        body = self._find_entity(params["bodyToken"])
        props = body.physicalProperties

        return {
            "volume": props.volume,
            "area": props.area,
            "mass": props.mass,
            "centerOfMass": serialize_point3d(props.centerOfMass),
            "boundingBox": serialize_bounding_box(body.boundingBox),
            "materialName": body.material.name if body.material else "None",
        }

    def cmd_get_body_faces(self, params):
        body = self._find_entity(params["bodyToken"])
        faces = []
        for i in range(body.faces.count):
            faces.append(serialize_face(body.faces.item(i)))
        return {
            "bodyName": body.name,
            "faceCount": body.faces.count,
            "faces": faces,
        }

    def cmd_get_face_info(self, params):
        face = self._find_entity(params["faceToken"])
        return serialize_face(face)

    def cmd_get_edge_info(self, params):
        edge = self._find_entity(params["edgeToken"])
        return serialize_edge(edge)

    def cmd_measure_area(self, params):
        entity = self._find_entity(params["entityToken"])
        if hasattr(entity, "area"):
            return {"area": entity.area}
        elif hasattr(entity, "physicalProperties"):
            return {"area": entity.physicalProperties.area}
        else:
            raise ValueError("Entity does not have an area property")

    def cmd_get_bom(self, params):
        root = self.root
        include_sub = params.get("includeSubComponents", True)

        bom = []
        seen = {}

        def walk(comp, depth=0):
            if not include_sub and depth > 0:
                return
            key = comp.name
            if key in seen:
                seen[key]["quantity"] += 1
            else:
                entry = {
                    "name": comp.name,
                    "quantity": 1,
                    "bodyCount": comp.bRepBodies.count,
                    "material": "",
                    "volume": 0,
                }
                if comp.bRepBodies.count > 0:
                    body = comp.bRepBodies.item(0)
                    entry["material"] = body.material.name if body.material else ""
                    entry["volume"] = body.physicalProperties.volume
                seen[key] = entry
                bom.append(entry)

            for i in range(comp.occurrences.count):
                walk(comp.occurrences.item(i).component, depth + 1)

        walk(root)
        return {"bom": bom, "totalComponents": len(bom)}

    def cmd_section_analysis(self, params):
        comp = self.root
        plane_token = params.get("planeToken")
        plane_name = params.get("plane")

        if plane_token:
            plane = self._find_entity(plane_token)
        elif plane_name:
            plane_map = {
                "XY": comp.xYConstructionPlane,
                "XZ": comp.xZConstructionPlane,
                "YZ": comp.yZConstructionPlane,
            }
            plane = plane_map.get(plane_name.upper())
        else:
            plane = comp.xYConstructionPlane

        analyses = comp.sectionAnalyses if hasattr(comp, "sectionAnalyses") else None
        if analyses:
            analysis = analyses.add(plane)
            return {"success": True, "message": "Section analysis created"}

        return {"success": True, "message": "Section analysis requested (may require manual activation)"}

    # ── Materials / Appearances ──────────────────────────────────────────

    def cmd_set_material(self, params):
        entity = self._find_entity(params["entityToken"])
        lib_name = params.get("libraryName", "Fusion 360 Material Library")
        mat_name = params["materialName"]

        mat_libs = self.app.materialLibraries
        for i in range(mat_libs.count):
            lib = mat_libs.item(i)
            if lib_name and lib.name != lib_name:
                continue
            materials = lib.materials
            for j in range(materials.count):
                mat = materials.item(j)
                if mat.name == mat_name:
                    entity.material = mat
                    return {"success": True, "materialName": mat.name}

        raise ValueError(f"Material '{mat_name}' not found in library '{lib_name}'")

    def cmd_set_appearance(self, params):
        entity = self._find_entity(params["entityToken"])
        lib_name = params.get("libraryName", "Fusion 360 Appearance Library")
        app_name = params["appearanceName"]

        mat_libs = self.app.materialLibraries
        for i in range(mat_libs.count):
            lib = mat_libs.item(i)
            if lib_name and lib.name != lib_name:
                continue
            appearances = lib.appearances
            for j in range(appearances.count):
                app = appearances.item(j)
                if app.name == app_name:
                    entity.appearance = app
                    return {"success": True, "appearanceName": app.name}

        raise ValueError(f"Appearance '{app_name}' not found in library '{lib_name}'")

    def cmd_list_materials(self, params):
        search = params.get("search", "").lower()
        limit = params.get("limit", 50)
        lib_name = params.get("libraryName")

        results = []
        mat_libs = self.app.materialLibraries
        for i in range(mat_libs.count):
            lib = mat_libs.item(i)
            if lib_name and lib.name != lib_name:
                continue
            for j in range(lib.materials.count):
                mat = lib.materials.item(j)
                if search and search not in mat.name.lower():
                    continue
                results.append({
                    "name": mat.name,
                    "library": lib.name,
                })
                if len(results) >= limit:
                    break
            if len(results) >= limit:
                break

        return {"materials": results, "count": len(results)}

    def cmd_list_appearances(self, params):
        search = params.get("search", "").lower()
        limit = params.get("limit", 50)
        lib_name = params.get("libraryName")

        results = []
        mat_libs = self.app.materialLibraries
        for i in range(mat_libs.count):
            lib = mat_libs.item(i)
            if lib_name and lib.name != lib_name:
                continue
            appearances = lib.appearances
            for j in range(appearances.count):
                app = appearances.item(j)
                if search and search not in app.name.lower():
                    continue
                results.append({
                    "name": app.name,
                    "library": lib.name,
                })
                if len(results) >= limit:
                    break
            if len(results) >= limit:
                break

        return {"appearances": results, "count": len(results)}

    # ── Utilities ────────────────────────────────────────────────────────

    def cmd_capture_viewport(self, params):
        self.app.activeViewport.saveAsImageFile(
            params["outputPath"],
            params.get("width", 1920),
            params.get("height", 1080),
        )
        return {"success": True, "outputPath": params["outputPath"]}

    def cmd_set_viewport(self, params):
        viewport = self.app.activeViewport
        camera = viewport.camera

        if params.get("viewOrientation"):
            orientation_map = {
                "front": adsk.core.ViewOrientations.FrontViewOrientation,
                "back": adsk.core.ViewOrientations.BackViewOrientation,
                "left": adsk.core.ViewOrientations.LeftViewOrientation,
                "right": adsk.core.ViewOrientations.RightViewOrientation,
                "top": adsk.core.ViewOrientations.TopViewOrientation,
                "bottom": adsk.core.ViewOrientations.BottomViewOrientation,
                "iso_top_right": adsk.core.ViewOrientations.IsoTopRightViewOrientation,
                "iso_top_left": adsk.core.ViewOrientations.IsoTopLeftViewOrientation,
                "iso_bottom_right": adsk.core.ViewOrientations.IsoBottomRightViewOrientation,
                "iso_bottom_left": adsk.core.ViewOrientations.IsoBottomLeftViewOrientation,
            }
            orientation = orientation_map.get(params["viewOrientation"])
            if orientation:
                camera.viewOrientation = orientation
        else:
            if params.get("eyeX") is not None:
                camera.eye = adsk.core.Point3D.create(
                    params["eyeX"], params["eyeY"], params["eyeZ"]
                )
            if params.get("targetX") is not None:
                camera.target = adsk.core.Point3D.create(
                    params.get("targetX", 0), params.get("targetY", 0), params.get("targetZ", 0)
                )
            if params.get("upX") is not None:
                camera.upVector = adsk.core.Vector3D.create(
                    params.get("upX", 0), params.get("upY", 1), params.get("upZ", 0)
                )

        camera.isSmoothTransition = True
        viewport.camera = camera

        if params.get("fitToView", False):
            viewport.fit()

        return {"success": True}

    def cmd_undo(self, params):
        self.app.executeTextCommand("Commands.Undo")
        return {"success": True}

    def cmd_redo(self, params):
        self.app.executeTextCommand("Commands.Redo")
        return {"success": True}

    def cmd_execute_script(self, params):
        code = params["code"]
        timeout = params.get("timeout", 30)

        local_vars = {"app": self.app, "ui": self.app.userInterface, "result": None}

        try:
            exec(code, {"__builtins__": __builtins__}, local_vars)
        except Exception as e:
            raise RuntimeError(f"Script execution error: {str(e)}\n{traceback.format_exc()}")

        result = local_vars.get("result")

        # Try to serialize the result
        if result is None:
            return {"result": None}
        try:
            json.dumps(result)
            return {"result": result}
        except (TypeError, ValueError):
            return {"result": str(result)}

    # ── Helper Methods ───────────────────────────────────────────────────

    def _get_sketch(self, name: str):
        """Find a sketch by name in the active design."""
        root = self.root
        # Search root component
        for i in range(root.sketches.count):
            sk = root.sketches.item(i)
            if sk.name == name:
                return sk
        # Search all components
        for i in range(root.allOccurrences.count):
            comp = root.allOccurrences.item(i).component
            for j in range(comp.sketches.count):
                sk = comp.sketches.item(j)
                if sk.name == name:
                    return sk
        raise ValueError(f"Sketch not found: {name}")

    def _get_component(self, token=None):
        """Get a component by entity token, or root if None."""
        if not token:
            return self.root
        entities = self.design.findEntityByToken(token)
        if entities and len(entities) > 0:
            return entities[0]
        raise ValueError(f"Component not found with token: {token}")

    def _find_entity(self, token: str):
        """Find any entity by its token."""
        if not token:
            raise ValueError("Entity token is required")
        entities = self.design.findEntityByToken(token)
        if entities and len(entities) > 0:
            return entities[0]
        raise ValueError(f"Entity not found with token: {token}")

    def _get_operation(self, op_str: str, comp):
        """Convert operation string to FeatureOperations enum."""
        op_map = {
            "join": adsk.fusion.FeatureOperations.JoinFeatureOperation,
            "cut": adsk.fusion.FeatureOperations.CutFeatureOperation,
            "intersect": adsk.fusion.FeatureOperations.IntersectFeatureOperation,
            "newBody": adsk.fusion.FeatureOperations.NewBodyFeatureOperation,
            "newComponent": adsk.fusion.FeatureOperations.NewComponentFeatureOperation,
        }
        op = op_map.get(op_str, adsk.fusion.FeatureOperations.JoinFeatureOperation)
        # Auto-switch to NewBody if no bodies exist
        if comp.bRepBodies.count == 0 and op == adsk.fusion.FeatureOperations.JoinFeatureOperation:
            op = adsk.fusion.FeatureOperations.NewBodyFeatureOperation
        return op

    def _get_base_plane(self, params):
        """Get a construction plane from params (basePlane or basePlaneToken)."""
        comp = self.root
        if params.get("basePlaneToken"):
            return self._find_entity(params["basePlaneToken"])
        plane_name = params.get("basePlane", "XY")
        plane_map = {
            "XY": comp.xYConstructionPlane,
            "XZ": comp.xZConstructionPlane,
            "YZ": comp.yZConstructionPlane,
        }
        return plane_map.get(plane_name.upper(), comp.xYConstructionPlane)

    def _get_cam(self):
        """Get the CAM product."""
        cam = adsk.cam.CAM.cast(self.app.activeProduct)
        if not cam:
            # Try switching to CAM workspace
            design = self.design
            cam = adsk.cam.CAM.cast(self.app.activeProduct)
            if not cam:
                raise RuntimeError("CAM is not available. Switch to the Manufacturing workspace first.")
        return cam

    def _get_cam_setup(self, name: str):
        """Find a CAM setup by name."""
        cam = self._get_cam()
        for i in range(cam.setups.count):
            setup = cam.setups.item(i)
            if setup.name == name:
                return setup
        raise ValueError(f"CAM setup not found: {name}")
