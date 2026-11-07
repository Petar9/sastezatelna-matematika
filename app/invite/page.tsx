import type {Metadata} from "next";
import {OnboardingFrame} from "@/components/onboarding";
import {ChildInvitation} from "@/components/child-invitation";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Споделен достъп",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function InvitationPage(){return <OnboardingFrame><ChildInvitation/></OnboardingFrame>;}
