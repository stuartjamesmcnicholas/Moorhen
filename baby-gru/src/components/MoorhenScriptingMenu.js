import { NavDropdown } from "react-bootstrap";
import { useState } from "react";
import { MoorhenExecuteScriptMenuItem } from "./MoorhenMenuItem";

export const MoorhenScriptingMenu = (props) => {
    const [popoverIsShown, setPopoverIsShown] = useState(false)
    const menuItemProps = { setPopoverIsShown, ...props }

    return < NavDropdown
        title="Scripting"
        id="cryo-scripting-dropdown"
        style={{ display: 'flex', alignItems: 'center' }}
        autoClose={popoverIsShown ? false : 'outside'}
        show={props.currentDropdownId === props.dropdownId}
        onToggle={() => { props.dropdownId !== props.currentDropdownId ? props.setCurrentDropdownId(props.dropdownId) : props.setCurrentDropdownId(-1) }}>
        <MoorhenExecuteScriptMenuItem {...menuItemProps} />
    </NavDropdown>
}
