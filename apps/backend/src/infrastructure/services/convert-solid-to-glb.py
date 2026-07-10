import os
import sys


def ensure_arguments():
    if len(sys.argv) < 3:
        raise RuntimeError("Kullanim: convert-solid-to-glb.py <input> <output>")
    return sys.argv[1], sys.argv[2]


def export_with_freecad(input_path, output_path):
    import FreeCAD  # type: ignore
    import ImportGui  # type: ignore

    document = FreeCAD.newDocument("SolidFlowCadConversion")
    try:
        ImportGui.insert(input_path, document.Name)
        document.recompute()

        exportables = []
        for obj in document.Objects:
            shape = getattr(obj, "Shape", None)
            if shape is not None and not shape.isNull():
                exportables.append(obj)

        if not exportables:
            raise RuntimeError("FreeCAD nesne olusturdu ancak export edilebilir geometri bulunamadi.")

        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        # FreeCAD glTF/GLB export destegi yukluysa dogrudan bu cagridan yararlanir.
        ImportGui.export(exportables, output_path)

        if not os.path.exists(output_path):
            raise RuntimeError("FreeCAD export tamamlandi ancak hedef .glb dosyasi olusmadi.")
    finally:
        try:
            FreeCAD.closeDocument(document.Name)
        except Exception:
            pass


def main():
    input_path, output_path = ensure_arguments()
    extension = os.path.splitext(input_path)[1].upper()
    if extension not in {".SLDPRT", ".SLDASM"}:
        raise RuntimeError(f"Desteklenmeyen CAD uzantisi: {extension}")

    export_with_freecad(input_path, output_path)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        sys.stderr.write(str(exc))
        sys.exit(1)
