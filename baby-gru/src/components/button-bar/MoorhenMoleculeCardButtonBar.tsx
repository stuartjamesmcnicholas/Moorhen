import React, { useState, useMemo, Fragment, useRef } from "react";
import { Button, DropdownButton } from "react-bootstrap";
import { convertViewtoPx } from '../../utils/MoorhenUtils';
import { MenuItem } from "@mui/material";
import { UndoOutlined, RedoOutlined, CenterFocusWeakOutlined, ExpandMoreOutlined, ExpandLessOutlined, VisibilityOffOutlined, VisibilityOutlined, DownloadOutlined, Settings } from '@mui/icons-material';
import { MoorhenDeleteDisplayObjectMenuItem } from "../menu-item/MoorhenDeleteDisplayObjectMenuItem"
import { MoorhenMergeMoleculesMenuItem } from "../menu-item/MoorhenMergeMoleculesMenuItem";
import { MoorhenMoleculeGaussianSurfaceSettingsMenuItem } from "../menu-item/MoorhenMoleculeGaussianSurfaceSettingsMenuItem"
import { MoorhenMoleculeSymmetrySettingsMenuItem } from "../menu-item/MoorhenMoleculeSymmetrySettingsMenuItem"
import { MoorhenMoleculeBondSettingsMenuItem } from "../menu-item/MoorhenMoleculeBondSettingsMenuItem"
import { MoorhenRenameDisplayObjectMenuItem } from "../menu-item/MoorhenRenameDisplayObjectMenuItem"
import { clickedResidueType } from "../card/MoorhenMoleculeCard";
import { moorhen } from "../../types/moorhen";
import { webGL } from "../../types/mgWebGL";

type MoorhenMoleculeCardButtonBarPropsType = {
    handleCentering: () => void;
    handleCopyFragment: () => void;
    handleDownload: () => Promise<void>;
    handleRedo: () => Promise<void>;
    handleUndo: () => Promise<void>;
    handleResidueRangeRefinement: () => void;
    handleVisibility: () => void;
    molecule: moorhen.Molecule;
    molecules: moorhen.Molecule[];
    changeMolecules: (arg0: moorhen.MolChange<moorhen.Molecule>) => void;
    glRef: React.RefObject<webGL.MGWebGL>;
    sideBarWidth: number;
    windowHeight: number;
    isVisible: boolean;
    isCollapsed: boolean;
    setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    clickedResidue: clickedResidueType;
    selectedResidues: [number, number];
    currentDropdownMolNo: number
    setCurrentDropdownMolNo: React.Dispatch<React.SetStateAction<number>>
    bondSettingsProps: {
        bondWidth: number;
        setBondWidth: React.Dispatch<React.SetStateAction<number>>;
        atomRadiusBondRatio: number;
        setAtomRadiusBondRatio: React.Dispatch<React.SetStateAction<number>>;
        bondSmoothness: number;
        setBondSmoothness: React.Dispatch<React.SetStateAction<number>>;
    };
    gaussianSettingsProps: {
        surfaceSigma: number;
        setSurfaceSigma: React.Dispatch<React.SetStateAction<number>>;
        surfaceLevel: number;
        setSurfaceLevel: React.Dispatch<React.SetStateAction<number>>;
        surfaceRadius: number;
        setSurfaceRadius: React.Dispatch<React.SetStateAction<number>>;
        surfaceGridScale: number;
        setSurfaceGridScale: React.Dispatch<React.SetStateAction<number>>;
    };
    symmetrySettingsProps: {
        symmetryRadius: number;
        setSymmetryRadius: React.Dispatch<React.SetStateAction<number>>;
    };
    backupsEnabled: boolean;
}

export const MoorhenMoleculeCardButtonBar = (props: MoorhenMoleculeCardButtonBarPropsType) => {
    const dropdownCardButtonRef = useRef<HTMLDivElement>()
    const [popoverIsShown, setPopoverIsShown] = useState<boolean>(false)
    const [currentName, setCurrentName] = useState<string>(props.molecule.name);

    useMemo(() => {
        if (currentName === "") {
            return
        }
        props.molecule.name = currentName

    }, [currentName]);


    const actionButtons: { [key: number]: { label: string; compressed: () => JSX.Element; expanded: null | (() => JSX.Element); } } = {
        1: {
            label: props.isVisible ? "Hide molecule" : "Show molecule",
            compressed: () => { return (<MenuItem key={1} onClick={props.handleVisibility}>{props.isVisible ? "Hide molecule" : "Show molecule"}</MenuItem>) },
            expanded: () => {
                return (<Button key={1} size="sm" variant="outlined" onClick={props.handleVisibility}>
                    {props.isVisible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                </Button>)
            }
        },
        2: {
            label: "Undo last action",
            compressed: () => { return (<MenuItem key={2} onClick={props.handleUndo} disabled={!props.backupsEnabled}>Undo last action</MenuItem>) },
            expanded: () => {
                return (<Button key={2} size="sm" variant="outlined" style={{borderWidth: props.backupsEnabled ? '' : '0px'}} onClick={props.handleUndo} disabled={!props.backupsEnabled}>
                    <UndoOutlined />
                </Button>)
            }
        },
        3: {
            label: "Redo previous action",
            compressed: () => { return (<MenuItem key={3} onClick={props.handleRedo} disabled={!props.backupsEnabled}>Redo previous action</MenuItem>) },
            expanded: () => {
                return (<Button key={3} size="sm" variant="outlined" style={{borderWidth: props.backupsEnabled ? '': '0px'}} onClick={props.handleRedo} disabled={!props.backupsEnabled}>
                    <RedoOutlined />
                </Button>)
            }
        },
        4: {
            label: "Center on molecule",
            compressed: () => { return (<MenuItem key={4} onClick={props.handleCentering}>Center on molecule</MenuItem>) },
            expanded: () => {
                return (<Button key={4} size="sm" variant="outlined" onClick={props.handleCentering}>
                    <CenterFocusWeakOutlined />
                </Button>)
            }
        },
        5: {
            label: "Download Molecule",
            compressed: () => { return (<MenuItem key={5} onClick={props.handleDownload}>Download molecule</MenuItem>) },
            expanded: () => {
                return (<Button key={5} size="sm" variant="outlined" onClick={props.handleDownload}>
                    <DownloadOutlined />
                </Button>)
            }
        },
        6: {
            label: 'Refine selected residues',
            compressed: () => { return (<MenuItem key={6} disabled={(!props.clickedResidue || !props.selectedResidues)} onClick={props.handleResidueRangeRefinement}>Refine selected residues</MenuItem>) },
            expanded: null
        },
        7: {
            label: 'Rename molecule',
            compressed: () => { return (<MoorhenRenameDisplayObjectMenuItem key={7} setPopoverIsShown={setPopoverIsShown} setCurrentName={setCurrentName} item={props.molecule} />) },
            expanded: null
        },
        8: {
            label: 'Copy selected residues into fragment',
            compressed: () => { return (<MenuItem key={8} disabled={(!props.clickedResidue || !props.selectedResidues)} onClick={props.handleCopyFragment}>Copy selected residues into fragment</MenuItem>) },
            expanded: null
        },
        9: {
            label: 'Merge molecules',
            compressed: () => { return (<MoorhenMergeMoleculesMenuItem key={9} glRef={props.glRef} molecules={props.molecules} setPopoverIsShown={setPopoverIsShown} menuItemText="Merge molecule into..." popoverPlacement='left' fromMolNo={props.molecule.molNo}/>) },
            expanded: null
        },
        10: {
            label: 'Bond display settings',
            compressed: () => { return (<MoorhenMoleculeBondSettingsMenuItem key={10} setPopoverIsShown={setPopoverIsShown} {...props.bondSettingsProps}/>) },
            expanded: null
        },
        11: {
            label: 'Gaussian surface display settings',
            compressed: () => { return (<MoorhenMoleculeGaussianSurfaceSettingsMenuItem key={11} setPopoverIsShown={setPopoverIsShown} {...props.gaussianSettingsProps}/>) },
            expanded: null
        },
        12: {
            label: 'Symmetry settings',
            compressed: () => { return (<MoorhenMoleculeSymmetrySettingsMenuItem key={12} setPopoverIsShown={setPopoverIsShown} molecule={props.molecule} glRef={props.glRef}/>) },
            expanded: null
        },
    }

    const maximumAllowedWidth = props.sideBarWidth * 0.55
    let currentlyUsedWidth = 0
    let expandedButtons: JSX.Element[] = []
    let compressedButtons: JSX.Element[] = []

    Object.keys(actionButtons).forEach(key => {
        if (actionButtons[key].expanded === null) {
            compressedButtons.push(actionButtons[key].compressed())
        } else {
            currentlyUsedWidth += 60
            if (currentlyUsedWidth < maximumAllowedWidth) {
                expandedButtons.push(actionButtons[key].expanded())
            } else {
                compressedButtons.push(actionButtons[key].compressed())
            }
        }
    })

    compressedButtons.push(
        <MoorhenDeleteDisplayObjectMenuItem 
            key="deleteDisplayObjectMenuItem"
            setPopoverIsShown={setPopoverIsShown} 
            glRef={props.glRef} 
            changeItemList={props.changeMolecules} 
            item={props.molecule} />
    )

    return <Fragment>
        {expandedButtons}
        <DropdownButton
            ref={dropdownCardButtonRef}
            key="dropDownButton"
            title={<Settings />}
            size="sm"
            variant="outlined"
            autoClose={popoverIsShown ? false : 'outside'}
            show={props.currentDropdownMolNo === props.molecule.molNo}
            onToggle={() => { props.molecule.molNo !== props.currentDropdownMolNo ? props.setCurrentDropdownMolNo(props.molecule.molNo) : props.setCurrentDropdownMolNo(-1) }}
            >
                <div style={{maxHeight: convertViewtoPx(50, props.windowHeight) * 0.5, overflowY: 'auto'}}>
                    {compressedButtons}
                </div>
            </DropdownButton>
        <Button key="expandButton"
            size="sm" variant="outlined"
            onClick={() => {
                props.setIsCollapsed(!props.isCollapsed)
            }}>
            {props.isCollapsed ? < ExpandMoreOutlined /> : <ExpandLessOutlined />}
        </Button>
    </Fragment>

}
