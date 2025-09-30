// src/pages/InputPage.tsx
import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonToast
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

const InputPage: React.FC = () => {
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [treeName, setTreeName] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Submit location (optional)
  const handleLocationSubmit = async () => {
    if (!municipality || !barangay) {
      setToastMessage("Please fill both Municipality and Barangay.");
      return;
    }

    try {
      await supabase
        .from("locations")
        .insert([{ municipality, barangay }]);

      setToastMessage(`Location "${barangay}, ${municipality}" saved!`);
      setMunicipality("");
      setBarangay("");
    } catch (error) {
      console.error(error);
      setToastMessage("Failed to save location. Check console.");
    }
  };

  // Submit tree (independent)
  const handleTreeSubmit = async () => {
    if (!treeName) {
      setToastMessage("Please enter a Tree Name.");
      return;
    }

    try {
      await supabase
        .from("trees")
        .insert([{ tree_name: treeName }]);

      setToastMessage(`Tree "${treeName}" saved successfully!`);
      setTreeName("");
    } catch (error) {
      console.error(error);
      setToastMessage("Failed to save tree. Check console.");
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Input Trees & Locations</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Location Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>New Location</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="floating">Municipality</IonLabel>
              <IonInput
                value={municipality}
                onIonChange={(e) => setMunicipality(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="floating">Barangay</IonLabel>
              <IonInput
                value={barangay}
                onIonChange={(e) => setBarangay(e.detail.value!)}
              />
            </IonItem>
            <IonButton expand="block" className="ion-margin-top" onClick={handleLocationSubmit}>
              Submit Location
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Tree Card */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>New Tree</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="floating">Tree Name</IonLabel>
              <IonInput
                value={treeName}
                onIonChange={(e) => setTreeName(e.detail.value!)}
              />
            </IonItem>
            <IonButton expand="block" className="ion-margin-top" onClick={handleTreeSubmit}>
              Submit Tree
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage}
          duration={2000}
          onDidDismiss={() => setToastMessage("")}
        />
      </IonContent>
    </IonPage>
  );
};

export default InputPage;
