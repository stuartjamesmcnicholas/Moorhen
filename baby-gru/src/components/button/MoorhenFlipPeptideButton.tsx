import { useEffect, useState } from "react"
import { getTooltipShortcutLabel } from "../../utils/MoorhenUtils"
import { moorhen } from "../../types/moorhen";
import { MoorhenContextButtonBase } from "./MoorhenContextButtonBase";
import { MoorhenEditButtonBase } from "./MoorhenEditButtonBase";

export const MoorhenFlipPeptideButton = (props: moorhen.EditButtonProps | moorhen.ContextButtonProps) => {

    const [toolTip, setToolTip] = useState<string>("Flip Peptide")

    const getCootCommandInput = (selectedMolecule: moorhen.Molecule, chosenAtom: moorhen.ResidueSpec, localParameters?: string): moorhen.cootCommandKwargs => {
        return {
            message: 'coot_command',
            returnType: "status",
            command: 'flipPeptide_cid',
            commandArgs: [
              selectedMolecule.molNo,
              `//${chosenAtom.chain_id}/${chosenAtom.res_no}/${chosenAtom.atom_name}${chosenAtom.alt_conf === "" ? "" : ":" + chosenAtom.alt_conf}`,
              chosenAtom.alt_conf === "" ? "" : chosenAtom.alt_conf
            ],
            changesMolecules: [selectedMolecule.molNo]
        }
    }

    useEffect(() => {
        if (props.shortCuts) {
            const shortCut = JSON.parse(props.shortCuts as string).flip_peptide
            setToolTip(`Flip Peptide ${getTooltipShortcutLabel(shortCut)}`)
        }
    }, [props.shortCuts])


    if (props.mode === 'context') {

        return <MoorhenContextButtonBase 
                    icon={<img style={{padding:'0.1rem', width:'100%', height: '100%'}} src={`${props.urlPrefix}/baby-gru/pixmaps/flip-peptide.svg`} alt='Flip peptide'/>}
                    needsMapData={true}
                    toolTipLabel={toolTip}
                    cootCommandInput={getCootCommandInput(props.selectedMolecule, props.chosenAtom)}
                    {...props}
                />     

    } else {

        return <MoorhenEditButtonBase
                    id="flip-peptide-edit-button"
                    toolTip={toolTip}
                    buttonIndex={props.buttonIndex}
                    selectedButtonIndex={props.selectedButtonIndex}
                    setSelectedButtonIndex={props.setSelectedButtonIndex}
                    needsMapData={false}
                    getCootCommandInput={getCootCommandInput}
                    prompt="Click atom in residue to flip"
                    icon={<img style={{ width: '100%', height: '100%' }} className="baby-gru-button-icon" src={`${props.urlPrefix}/baby-gru/pixmaps/flip-peptide.svg`} alt='Flip Peptide' />}
                    {...props}
                />
    
    }

}
