import adsk.core
import adsk.fusion
import math


def serialize_point3d(point):
    """Serialize an adsk.core.Point3D to a dict."""
    if point is None:
        return None
    return {"x": point.x, "y": point.y, "z": point.z}


def serialize_vector3d(vector):
    """Serialize an adsk.core.Vector3D to a dict."""
    if vector is None:
        return None
    return {"x": vector.x, "y": vector.y, "z": vector.z}


def serialize_bounding_box(bb):
    """Serialize an adsk.core.BoundingBox3D to a dict."""
    if bb is None:
        return None
    return {
        "min": serialize_point3d(bb.minPoint),
        "max": serialize_point3d(bb.maxPoint),
    }


def serialize_body(body):
    """Serialize a BRepBody to a summary dict."""
    if body is None:
        return None
    return {
        "name": body.name,
        "entityToken": body.entityToken,
        "type": "solid" if body.isSolid else "surface",
        "isVisible": body.isVisible,
        "faceCount": body.faces.count,
        "edgeCount": body.edges.count,
    }


def serialize_face(face):
    """Serialize a BRepFace to a dict."""
    if face is None:
        return None
    geo = face.geometry
    geo_type = type(geo).__name__
    result = {
        "entityToken": face.entityToken,
        "geometryType": geo_type,
        "area": face.area,
    }
    if isinstance(geo, adsk.core.Plane):
        result["normal"] = serialize_vector3d(geo.normal)
        result["origin"] = serialize_point3d(geo.origin)
    elif isinstance(geo, adsk.core.Cylinder):
        result["radius"] = geo.radius
        result["axis"] = serialize_vector3d(geo.axis)
        result["origin"] = serialize_point3d(geo.origin)
    elif isinstance(geo, adsk.core.Sphere):
        result["radius"] = geo.radius
        result["center"] = serialize_point3d(geo.origin)
    elif isinstance(geo, adsk.core.Cone):
        result["halfAngle"] = math.degrees(geo.halfAngle)
        result["axis"] = serialize_vector3d(geo.axis)
    elif isinstance(geo, adsk.core.Torus):
        result["majorRadius"] = geo.majorRadius
        result["minorRadius"] = geo.minorRadius
    return result


def serialize_edge(edge):
    """Serialize a BRepEdge to a dict."""
    if edge is None:
        return None
    geo = edge.geometry
    geo_type = type(geo).__name__
    result = {
        "entityToken": edge.entityToken,
        "geometryType": geo_type,
        "length": edge.length,
        "startPoint": serialize_point3d(edge.startVertex.geometry if edge.startVertex else None),
        "endPoint": serialize_point3d(edge.endVertex.geometry if edge.endVertex else None),
    }
    if isinstance(geo, adsk.core.Line3D):
        pass  # start/end already covered
    elif isinstance(geo, adsk.core.Arc3D):
        result["center"] = serialize_point3d(geo.center)
        result["radius"] = geo.radius
    elif isinstance(geo, adsk.core.Circle3D):
        result["center"] = serialize_point3d(geo.center)
        result["radius"] = geo.radius
    return result


def serialize_sketch(sketch):
    """Serialize a Sketch to a summary dict."""
    if sketch is None:
        return None
    return {
        "name": sketch.name,
        "entityToken": sketch.entityToken,
        "profileCount": sketch.profiles.count,
        "curveCount": sketch.sketchCurves.count,
        "constraintCount": sketch.geometricConstraints.count,
        "dimensionCount": sketch.sketchDimensions.count,
        "isFullyConstrained": sketch.isFullyConstrained if hasattr(sketch, "isFullyConstrained") else None,
    }


def serialize_component(component, depth=0, max_depth=10):
    """Serialize a Component and its occurrence tree recursively."""
    if component is None or depth > max_depth:
        return None

    bodies = []
    for i in range(component.bRepBodies.count):
        body = component.bRepBodies.item(i)
        bodies.append({
            "name": body.name,
            "entityToken": body.entityToken,
            "type": "solid" if body.isSolid else "surface",
        })

    sketches = []
    for i in range(component.sketches.count):
        sk = component.sketches.item(i)
        sketches.append({
            "name": sk.name,
            "entityToken": sk.entityToken,
        })

    joints = []
    for i in range(component.joints.count):
        j = component.joints.item(i)
        joints.append({
            "name": j.name,
            "entityToken": j.entityToken,
            "type": str(j.jointMotion.jointType) if j.jointMotion else "unknown",
        })

    occurrences = []
    for i in range(component.occurrences.count):
        occ = component.occurrences.item(i)
        occurrences.append(serialize_component(occ.component, depth + 1, max_depth))

    return {
        "name": component.name,
        "entityToken": component.entityToken,
        "bodies": bodies,
        "sketches": sketches,
        "joints": joints,
        "occurrences": occurrences,
    }


def serialize_parameter(param):
    """Serialize a parameter to a dict."""
    if param is None:
        return None
    return {
        "name": param.name,
        "value": param.value,
        "expression": param.expression,
        "unit": param.unit,
        "comment": param.comment if hasattr(param, "comment") else "",
    }
