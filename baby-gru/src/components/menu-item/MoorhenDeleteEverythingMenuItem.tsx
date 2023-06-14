import { Form } from "react-bootstrap"
import { MoorhenBaseMenuItem } from "./MoorhenBaseMenuItem"
import { MoorhenMapInterface } from "../../utils/MoorhenMap";
import { MoorhenMoleculeInterface } from "../../utils/MoorhenMolecule";
import { MolChange } from "../MoorhenApp";

export const MoorhenDeleteEverythingMenuItem = (props: {
    maps: MoorhenMapInterface[];
    glRef: React.RefObject<mgWebGLType>;
    molecules: MoorhenMoleculeInterface[];
    changeMaps: (arg0: MolChange<MoorhenMapInterface>) => void;
    changeMolecules: (arg0: MolChange<MoorhenMoleculeInterface>) => void;
    setPopoverIsShown: React.Dispatch<React.SetStateAction<boolean>> 
}) => {

    const panelContent = <>
        <Form.Group style={{ width: '18rem', margin: '0.5rem' }} controlId="MoorhenGetDeleteEverythingMenuItem" className="mb-3">
            <span style={{ fontWeight: 'bold' }}>Warning: this action cannot be reversed.</span>
        </Form.Group>
    </>

    const onCompleted = () => {
        props.maps.forEach(map => {
            map.delete(props.glRef)
        })
        props.molecules.forEach(molecule => {
            molecule.delete(props.glRef)
        })
        props.changeMaps({ action: 'Empty' })
        props.changeMolecules({ action: "Empty" })
    }

    return <MoorhenBaseMenuItem
        id='delete-everything-menu-item'
        textClassName="text-danger"
        buttonVariant="danger"
        buttonText="I understand, delete"
        popoverContent={panelContent}
        menuItemText="Delete everything"
        onCompleted={onCompleted}
        setPopoverIsShown={props.setPopoverIsShown}
    />
}

