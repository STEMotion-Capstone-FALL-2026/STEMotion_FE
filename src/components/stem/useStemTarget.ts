import { useEffect, useState } from 'react';
import { scriptService } from '../../services/scriptService';
import type { StemTarget } from '../../types/stem';

export function useStemTarget(projectId: string, version?: string | number) {
  const [state, setState] = useState<{target: StemTarget | null; error: unknown}>({target:null,error:null});
  useEffect(() => {
    let current=true;
    setState({target:null,error:null});
    scriptService.getStemTarget(projectId).then(target=>{if(current)setState({target,error:null});})
      .catch(error=>{if(current)setState({target:null,error});});
    return ()=>{current=false;};
  },[projectId,version]);
  return state;
}
