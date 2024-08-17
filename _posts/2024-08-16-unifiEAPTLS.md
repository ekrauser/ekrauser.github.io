# EAP-TLS with On-Prem AD and Unifi APs

Full disclosure, this isn't going to be a tutorial. This relies on a lot of prexisting infrastructure that I will not be diving into here. This assumes you already have a fully configured and deployed enviroment consisting of at least:

- At least one domain controller with Active directory domain services
- At least one windows machine running active directory certificate services (as the enterprise root)
- At least one windows machine running network policy server for radius (you could use FreeRadius or anything else, but I already have it and like the seamless integration)

All of these roles can be deployed to the same machine, and technically you only need a single instace of windows server (physical or virtual) to run that **however** I would strongly advise against doing this. 

The relevant parts of my enviroment at home consists of the following:

- 3 windows server 19' VMs (one core) running ADDS and DNS. Domain controllers A and B also run NPS
- 2 windows server 16' VMs running ADCS, one configured as an offline root, the other as an online enterprise subordinate (the subordinate also has most of the role services, the root only has CA)
- Unifi APs and UDMP

ADCS setup is a beast in and of itself, especially when trying to build to mimic a real deployment but that is way out of scope for what we're talking about here. Maybe in a future update I'll dive into it. It's handy to be able to roll your own certs for ilo/idrac pages or other internal stuff so you can https everything without the cert warning annoyance (but there are other ways...).

## The Setup

Starting on the cert server:

1. Open up certsrv.msc go right click on certificate templates and click manage
2. Now in the Certificate templates console, right click on RAS and IAS server and click duplicate template
3. I only support win 10/svr16 and newer clients, so I'm selecting that in the compatabilty tab
4. In general give the template a name, I did "SkynetWiFi-NPS" to keep it on brand
5. In crypto I'm bumping up the key size to 4096
6. In subject name, build from AD, common name + DNS name
7. Security RAS and IAS servers get read, enroll and auto enroll
7. Leaving everything else at the default, then OK

Now back to certsrv.msc, right click certificate templates again -> new -> certificate template to issue and select the new certificate template (SkynetWifi-NPS in my case)

Run a gpupdate and you should have the cert we're looking for errrrr nope, request it manually because it'll leave the subject field blank and freak out the unifi crap. It should auto renew with the same info though (hopefully).

Now lets open up NPS, create shared secrete template first (**NOTE the UDMP will only take a 48 char max secret, you'll have to chop it down from the generated one**)

We're gonna use powershell to add the APs and the UDMP as RADIUS clients because aint no one got time for that.

```powershell
# Define the list of clients we want to add
$clients = @(
    @{
        Name = "Skynet-UDMP"
        Address = "192.168.1.1"
    },
    @{
        Name = "U6-Pro"
        Address = "192.168.1.30"
    },
    @{
        Name = "UAP-AC-Lite"
        Address = "192.168.1.31"
    },
    @{
        Name = "UAP"
        Address = "192.168.1.32"
    }
)

# Define the shared secret template name
$sharedSecretTemplate = "SkynetWifi-Unifi"

# Loop through each client and add them using PowerShell cmdlets
foreach ($client in $clients) {
    $name = $client.Name
    $address = $client.Address

    # Retrieve the shared secret template
    $template = Get-NpsSharedSecretTemplate -Name $sharedSecretTemplate

    if ($template) {
        # Add the RADIUS client using the shared secret template
        New-NpsRadiusClient -Name $name -Address $address -SharedSecretTemplate $template
        Write-Host "Added RADIUS client $name with IP $address using shared secret template $sharedSecretTemplate"
    } else {
        Write-Host "Shared secret template $sharedSecretTemplate not found!"
    }
}
```

Also while we're in an admin shell run this so we get some more logs later

```powershell
auditpol /set /subcategory:"Network Policy Server" /success:enable /failure:enable
```

Still in NPS right click connection request policies under policies and click new. Name it and leave it unspecified, add a new condition of NAS port type and add wireless - ieee 802.11 and wireless - other. Leave request forwarding at defaults, next. Check override network policy auth settings, click add, add PEAP and click edit and make sure the selected cert is that new NPS cert (you can tell by the exp date), click ok. Now add MS-CHAP-v2 to the list, and check the boxes for MS-CHAP and v2, and the user can change password boxes. Next, next and finish.

TODO add EAPTLS6 PIC

Now we need a new network policy, right click on network policies and click new. Give it a name, and leave it unspecified. For conditions, we're going to add the same two NAS Port entries for wireless, and we're also going to add that user group we created "WifiUsers" next, access granted, next. Add PEAP and MS-CHAP-v2 to the list again, make sure PEAP has the right cert same as before, leave everything else default. Next, next, next, finish. 

TODO ADD EAPTLS7 PIC

Over on the UDMP, settings -> profiles -> RADIUS -> create new.  

MAKE SURE APs ARE SET TO STATIC

Enable for wireless networks, add the IP address of the NPS server, leave the port, and paste in the secret and save

TODO ADD EAPTLS3 PIC

Now go over to WiFi -> Create new -> name it (SkyFi-Ent in my case), pick your network (trusted-LAN), select manual and scroll down to security protocol, select WPA2 enterprise and select the new RADIUS profile we just created. Leave everything else at detault for now and click Add Wifi Network.

Do all that then get this error on the NPS server Negotiation failed. Requested EAP methods not available because this unifi shit is a toy. 

To be continued...